<?php
require_once 'CONEXION.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['id'])) {
        throw new Exception("ID de miembro no proporcionado");
    }

    $conn = obtenerConexion();
    $id = $conn->real_escape_string($data['id']);

    // Eliminar miembro
    $sql = "DELETE FROM miembros WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Miembro eliminado correctamente"
            ]);
        } else {
            throw new Exception("No se encontró el miembro con ID: $id");
        }
    } else {
        throw new Exception("Error al eliminar miembro: " . $stmt->error);
    }

    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        cerrarConexion();
    }
}
?>