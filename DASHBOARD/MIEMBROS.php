<?php
// Incluir archivo de conexión
require_once 'CONEXION.php';

// Headers para API REST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('X-Content-Type-Options: nosniff');

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
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Método no permitido. Use GET.");
    }

    // Obtener conexión a la base de datos
    $conn = obtenerConexion();

    // Consulta para obtener todos los miembros
    $sql = "SELECT id, nombre, apellido_paterno, apellido_materno, edad, sexo, fecha_registro, monto_inscripcion 
            FROM miembros 
            ORDER BY fecha_registro DESC";

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $miembros = [];
    while ($row = $result->fetch_assoc()) {
        // Asegurar que los valores no sean null
        $miembros[] = [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'] ?? '',
            'apellido_paterno' => $row['apellido_paterno'] ?? '',
            'apellido_materno' => $row['apellido_materno'] ?? '',
            'edad' => (int) $row['edad'],
            'sexo' => $row['sexo'] ?? '',
            'fecha_registro' => $row['fecha_registro'] ?? '',
            'monto_inscripcion' => (float) $row['monto_inscripcion']
        ];
    }

    // Preparar respuesta exitosa
    $response = [
        "success" => true,
        "message" => "Miembros obtenidos correctamente",
        "miembros" => $miembros,
        "total" => count($miembros),
        "timestamp" => date('Y-m-d H:i:s')
    ];

    http_response_code(200);

} catch (Exception $e) {
    // Log del error (en producción)
    error_log("Error en obtener_miembros.php: " . $e->getMessage());

    // Preparar respuesta de error
    $response = [
        "success" => false,
        "message" => "Error al obtener los miembros",
        "error" => $e->getMessage(),
        "timestamp" => date('Y-m-d H:i:s')
    ];

    http_response_code(500);

} finally {
    // Cerrar conexión si está abierta
    if ($conn) {
        cerrarConexion();
    }

    // Enviar respuesta JSON
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
?>