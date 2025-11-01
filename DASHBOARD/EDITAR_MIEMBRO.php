<?php
// Incluir archivo de conexión
require_once 'CONEXION.php';

// Headers para API REST - IMPORTANTE: ponerlos al inicio sin espacios antes
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Desactivar visualización de errores
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Inicializar variables
$conn = null;
$response = [];

try {
    // Verificar método de solicitud
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido. Use POST.");
    }

    // Obtener datos del POST
    $input = file_get_contents('php://input');

    if (empty($input)) {
        throw new Exception("No se recibieron datos");
    }

    $data = json_decode($input, true);

    // Validar JSON
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Datos JSON inválidos");
    }

    // Validar datos requeridos
    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception("ID de miembro no proporcionado");
    }
    if (!isset($data['nombre']) || empty(trim($data['nombre']))) {
        throw new Exception("Nombre no proporcionado");
    }
    if (!isset($data['apellido_paterno']) || empty(trim($data['apellido_paterno']))) {
        throw new Exception("Apellido paterno no proporcionado");
    }
    if (!isset($data['edad']) || empty($data['edad'])) {
        throw new Exception("Edad no proporcionada");
    }

    // Obtener conexión a la base de datos
    $conn = obtenerConexion();

    // Sanitizar datos
    $id = intval($data['id']);
    $nombre = $conn->real_escape_string(trim($data['nombre']));
    $apellido_paterno = $conn->real_escape_string(trim($data['apellido_paterno']));
    $apellido_materno = isset($data['apellido_materno']) ? $conn->real_escape_string(trim($data['apellido_materno'])) : '';
    $edad = intval($data['edad']);

    // Debug: verificar datos
    error_log("Datos recibidos: ID=$id, Nombre=$nombre, ApellidoP=$apellido_paterno, Edad=$edad");

    // Actualizar miembro
    $sql = "UPDATE miembros SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, edad = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("sssii", $nombre, $apellido_paterno, $apellido_materno, $edad, $id);

    if ($stmt->execute()) {
        $response = [
            "success" => true,
            "message" => "Miembro actualizado correctamente",
            "id" => $id
        ];
    } else {
        throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
    }

    $stmt->close();

} catch (Exception $e) {
    // Log del error
    error_log("Error en editar_miembro.php: " . $e->getMessage());

    // Preparar respuesta de error
    $response = [
        "success" => false,
        "message" => $e->getMessage()
    ];

    http_response_code(500);

} finally {
    // Cerrar conexión si está abierta
    if ($conn) {
        $conn->close();
    }

    // Enviar respuesta JSON
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}
?>