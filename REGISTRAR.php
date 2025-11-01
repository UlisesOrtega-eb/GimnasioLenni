<?php
// Incluir archivo de conexión
require_once 'CONEXION.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Obtener conexión a la base de datos usando nuestra clase de conexión
    $conn = obtenerConexion();

    // Obtener datos del POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        // Validar que se recibieron datos JSON
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Datos JSON inválidos"]);
            exit();
        }

        // Validar datos recibidos
        $errors = [];

        if (!isset($data['nombre']) || empty(trim($data['nombre']))) {
            $errors[] = "El nombre es requerido";
        }

        if (!isset($data['apellido_paterno']) || empty(trim($data['apellido_paterno']))) {
            $errors[] = "El apellido paterno es requerido";
        }

        if (!isset($data['edad']) || empty(trim($data['edad']))) {
            $errors[] = "La edad es requerida";
        } elseif (!is_numeric($data['edad']) || $data['edad'] < 15 || $data['edad'] > 100) {
            $errors[] = "La edad debe ser un número entre 15 y 100";
        }

        if (!isset($data['sexo']) || empty(trim($data['sexo']))) {
            $errors[] = "El sexo es requerido";
        } elseif (!in_array($data['sexo'], ['M', 'F'])) {
            $errors[] = "El sexo debe ser M o F";
        }

        if (!isset($data['monto_inscripcion']) || empty(trim($data['monto_inscripcion']))) {
            $errors[] = "El monto de inscripción es requerido";
        } elseif (!is_numeric($data['monto_inscripcion']) || $data['monto_inscripcion'] < 0) {
            $errors[] = "El monto de inscripción debe ser un número positivo";
        }

        // Si hay errores, retornarlos
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Errores de validación", "errors" => $errors]);
            exit();
        }

        // Sanitizar datos
        $nombre = $conn->real_escape_string(trim($data['nombre']));
        $apellido_paterno = $conn->real_escape_string(trim($data['apellido_paterno']));
        $apellido_materno = isset($data['apellido_materno']) ? $conn->real_escape_string(trim($data['apellido_materno'])) : '';
        $edad = intval($data['edad']);
        $sexo = $conn->real_escape_string($data['sexo']);
        $monto_inscripcion = floatval($data['monto_inscripcion']);

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Insertar en la tabla de miembros
            $sql = "INSERT INTO miembros (nombre, apellido_paterno, apellido_materno, edad, sexo, monto_inscripcion) 
                    VALUES (?, ?, ?, ?, ?, ?)";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssisd", $nombre, $apellido_paterno, $apellido_materno, $edad, $sexo, $monto_inscripcion);

            if (!$stmt->execute()) {
                throw new Exception("Error al registrar miembro: " . $stmt->error);
            }

            $id_miembro = $conn->insert_id;

            // Registrar el movimiento de caja si el monto es mayor a 0
            if ($monto_inscripcion > 0) {
                $motivo = "Inscripción de $nombre $apellido_paterno";
                $tipo = "ingreso";

                $sql_caja = "INSERT INTO movimientos_caja (tipo, monto, motivo) VALUES (?, ?, ?)";
                $stmt_caja = $conn->prepare($sql_caja);
                $stmt_caja->bind_param("sds", $tipo, $monto_inscripcion, $motivo);

                if (!$stmt_caja->execute()) {
                    throw new Exception("Error al registrar movimiento de caja: " . $stmt_caja->error);
                }

                $stmt_caja->close();
            }

            // Confirmar transacción
            $conn->commit();

            // Respuesta exitosa
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Miembro registrado correctamente",
                "id" => $id_miembro,
                "data" => [
                    "nombre" => $nombre,
                    "apellido_paterno" => $apellido_paterno,
                    "apellido_materno" => $apellido_materno,
                    "edad" => $edad,
                    "sexo" => $sexo,
                    "monto_inscripcion" => $monto_inscripcion
                ]
            ]);

        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();

            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }

        if (isset($stmt)) {
            $stmt->close();
        }

    } else {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $e->getMessage()]);
} finally {
    // Cerrar conexión si está abierta
    if (isset($conn)) {
        cerrarConexion();
    }
}
?>