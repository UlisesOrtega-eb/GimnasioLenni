<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir conexión con ruta absoluta
require_once(__DIR__ . '/CONEXION.php');// Obtener datos crudos del POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Verificar si se recibieron datos
if ($data === null) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Error: JSON inválido o vacío",
        "raw_input" => $input,
        "json_error" => json_last_error_msg()
    ]);
    exit();
}

// Verificar estructura de datos esperada
if (!isset($data['ventas']) || !is_array($data['ventas']) || empty($data['ventas'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Error: Estructura de datos incorrecta. Se esperaba array 'ventas'",
        "received_data" => $data
    ]);
    exit();
}

try {
    $conn = obtenerConexion();
    $conn->begin_transaction(); // Iniciar transacción para múltiples inserciones

    $ventasProcesadas = [];
    $errores = [];

    foreach ($data['ventas'] as $index => $venta) {
        // Validar campos requeridos para cada venta
        $camposRequeridos = ['producto_id', 'cantidad', 'monto_total', 'metodo_pago'];
        $camposFaltantes = [];

        foreach ($camposRequeridos as $campo) {
            if (!isset($venta[$campo]) || $venta[$campo] === '' || $venta[$campo] === null) {
                $camposFaltantes[] = $campo;
            }
        }

        if (!empty($camposFaltantes)) {
            $errores[] = "Venta $index: Campos faltantes - " . implode(', ', $camposFaltantes);
            continue;
        }

        // Preparar y ejecutar la consulta
        $producto_id = (int) $venta['producto_id'];
        $cantidad = (int) $venta['cantidad'];
        $monto_total = (float) $venta['monto_total'];
        $metodo_pago = $conn->real_escape_string($venta['metodo_pago']);

        $sql = "INSERT INTO ventas (producto_id, cantidad, monto_total, metodo_pago, fecha_venta) 
                VALUES (?, ?, ?, ?, NOW())";

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            $errores[] = "Venta $index: Error preparando consulta - " . $conn->error;
            continue;
        }

        $stmt->bind_param("iids", $producto_id, $cantidad, $monto_total, $metodo_pago);

        if ($stmt->execute()) {
            $ventasProcesadas[] = [
                'venta_id' => $stmt->insert_id,
                'producto_id' => $producto_id,
                'producto_nombre' => $venta['producto_nombre'] ?? 'N/A',
                'cantidad' => $cantidad,
                'monto_total' => $monto_total
            ];
        } else {
            $errores[] = "Venta $index: Error ejecutando consulta - " . $stmt->error;
        }

        $stmt->close();
    }

    // Verificar si hubo errores
    if (!empty($errores)) {
        $conn->rollback(); // Revertir todas las inserciones

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Errores en el procesamiento de ventas",
            "errores" => $errores,
            "ventas_exitosas" => count($ventasProcesadas),
            "ventas_fallidas" => count($errores)
        ]);
    } else {
        $conn->commit(); // Confirmar todas las inserciones

        echo json_encode([
            "success" => true,
            "message" => "Todas las ventas procesadas exitosamente",
            "total_ventas" => count($ventasProcesadas),
            "total_monto" => $data['total_venta'] ?? array_sum(array_column($ventasProcesadas, 'monto_total')),
            "ventas" => $ventasProcesadas
        ]);
    }

    $conn->close();

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error del servidor: " . $e->getMessage(),
        "error_details" => $e->getFile() . ":" . $e->getLine()
    ]);
}
?>