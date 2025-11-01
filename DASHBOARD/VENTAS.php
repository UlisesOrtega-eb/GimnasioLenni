<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$servername = "localhost";
$username = "root";
$password = "Th3b4k3nd";
$database = "gym";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $database);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $conn->connect_error
    ]));
}

$conn->set_charset("utf8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($input) {
        try {
            $conn->begin_transaction();

            // Para cada producto, verificar si existe en la tabla productos
            foreach ($input['productos'] as $producto) {
                // Verificar si el producto existe
                $check_stmt = $conn->prepare("SELECT id FROM productos WHERE id = ?");
                $check_stmt->bind_param("i", $producto['producto_id']);
                $check_stmt->execute();
                $check_result = $check_stmt->get_result();

                if ($check_result->num_rows == 0) {
                    // El producto no existe, insertarlo primero
                    $insert_stmt = $conn->prepare("INSERT INTO productos (id, nombre, precio, stock) VALUES (?, ?, ?, 100)");
                    $insert_stmt->bind_param("isd", $producto['producto_id'], $producto['nombre'], $producto['precio']);

                    if (!$insert_stmt->execute()) {
                        throw new Exception("Error al insertar producto: " . $insert_stmt->error);
                    }
                    $insert_stmt->close();
                }
                $check_stmt->close();

                // Ahora insertar la venta
                $monto_total = $producto['cantidad'] * $producto['precio'];
                $stmt = $conn->prepare("INSERT INTO ventas (producto_id, cantidad, monto_total, metodo_pago) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("iids", $producto['producto_id'], $producto['cantidad'], $monto_total, $input['metodo_pago']);

                if (!$stmt->execute()) {
                    throw new Exception("Error al insertar venta: " . $stmt->error);
                }
                $stmt->close();
            }

            $conn->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Venta registrada correctamente'
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Datos de entrada inválidos'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
}

$conn->close();
?>