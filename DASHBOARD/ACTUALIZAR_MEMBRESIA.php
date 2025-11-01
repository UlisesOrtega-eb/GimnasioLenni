<?php
// Incluir archivo de conexión
require_once 'CONEXION.php';

// Headers para API REST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Desactivar visualización de errores en producción
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
        throw new Exception("Datos JSON inválidos: " . json_last_error_msg());
    }

    // Validar datos requeridos
    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception("ID de miembro no proporcionado");
    }

    // Obtener conexión a la base de datos
    $conn = obtenerConexion();
    $id = intval($data['id']);

    // Actualizar fecha de registro a la fecha actual
    $sql = "UPDATE miembros SET fecha_registro = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        $response = [
            "success" => true,
            "message" => "Membresía renovada correctamente",
            "id" => $id,
            "fecha_actualizada" => date('Y-m-d H:i:s')
        ];
    } else {
        throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
    }

    $stmt->close();

} catch (Exception $e) {
    // Log del error
    error_log("Error en actualizar_membresia.php: " . $e->getMessage());

    // Preparar respuesta de error
    $response = [
        "success" => false,
        "message" => "Error al renovar membresía: " . $e->getMessage()
    ];

    http_response_code(500);

} finally {
    // Cerrar conexión si está abierta
    if ($conn) {
        cerrarConexion();
    }

    // Enviar respuesta JSON
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}
?>