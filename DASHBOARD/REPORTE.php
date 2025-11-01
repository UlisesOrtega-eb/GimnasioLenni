<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$logFile = 'errores_gym.log';

function logError($message)
{
    global $logFile;
    $timestamp = date('[Y-m-d H:i:s]');
    file_put_contents($logFile, $timestamp . " " . $message . PHP_EOL, FILE_APPEND);
}

// Función para depuración
function debugLog($message)
{
    file_put_contents('debug.log', date('[Y-m-d H:i:s]') . " " . $message . PHP_EOL, FILE_APPEND);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Método no permitido', 405);
    }

    // Conexión directa a la base de datos
    $host = 'localhost';
    $dbname = 'gym';
    $username = 'root';
    $password = 'Th3b4k3nd';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $conn = new PDO($dsn, $username, $password, $options);
    debugLog("Conexión a BD exitosa");

    $tipo = $_GET['tipo'] ?? 'dia';
    debugLog("Tipo de reporte: " . $tipo);

    if (!in_array($tipo, ['dia', 'semana', 'mes', 'personalizado'])) {
        throw new Exception('Tipo de reporte no válido', 400);
    }

    // Construir filtros
    $filtroBase = "";
    $params = [];
    $titulo = "";

    switch ($tipo) {
        case 'dia':
            $fecha = $_GET['fecha'] ?? date('Y-m-d');
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                throw new Exception('Formato de fecha inválido para día', 400);
            }
            $filtroBase = "DATE(%s) = :fecha";
            $params[':fecha'] = $fecha;
            $titulo = "Reporte del día " . date('d/m/Y', strtotime($fecha));
            break;

        case 'semana':
            $fecha = $_GET['fecha'] ?? date('Y-m-d');
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                throw new Exception('Formato de fecha inválido para semana', 400);
            }
            $domingo = date('Y-m-d', strtotime($fecha . ' +6 days'));
            $filtroBase = "DATE(%s) BETWEEN :fecha AND :domingo";
            $params[':fecha'] = $fecha;
            $params[':domingo'] = $domingo;
            $titulo = "Reporte de la semana " . date('d/m/Y', strtotime($fecha)) . " al " . date('d/m/Y', strtotime($domingo));
            break;

        case 'mes':
            $fecha = $_GET['fecha'] ?? date('Y-m');
            if (!preg_match('/^\d{4}-\d{2}$/', $fecha)) {
                throw new Exception('Formato de mes inválido', 400);
            }
            $primerDia = date('Y-m-01', strtotime($fecha));
            $ultimoDia = date('Y-m-t', strtotime($fecha));
            $filtroBase = "DATE(%s) BETWEEN :primerDia AND :ultimoDia";
            $params[':primerDia'] = $primerDia;
            $params[':ultimoDia'] = $ultimoDia;
            $titulo = "Reporte del mes " . date('m/Y', strtotime($fecha));
            break;

        case 'personalizado':
            $inicio = $_GET['inicio'] ?? date('Y-m-d');
            $fin = $_GET['fin'] ?? date('Y-m-d');

            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inicio) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fin)) {
                throw new Exception('Formato de fechas inválido', 400);
            }

            if ($inicio > $fin) {
                throw new Exception('La fecha de inicio no puede ser mayor a la fecha final', 400);
            }

            $filtroBase = "DATE(%s) BETWEEN :inicio AND :fin";
            $params[':inicio'] = $inicio;
            $params[':fin'] = $fin;
            $titulo = "Reporte del " . date('d/m/Y', strtotime($inicio)) . " al " . date('d/m/Y', strtotime($fin));
            break;
    }

    debugLog("Filtro base: " . $filtroBase);
    debugLog("Parámetros: " . json_encode($params));

    // Construir WHERE específicos para cada tabla
    $whereVentas = sprintf($filtroBase, 'fecha_venta');
    $whereMiembros = sprintf($filtroBase, 'fecha_registro');
    $whereMovimientos = sprintf($filtroBase, 'fecha_movimiento');

    debugLog("WHERE ventas: " . $whereVentas);
    debugLog("WHERE miembros: " . $whereMiembros);
    debugLog("WHERE movimientos: " . $whereMovimientos);

    // 1. CONSULTA DE VENTAS DE PRODUCTOS
    $queryVentas = "
        SELECT 
            v.id,
            v.fecha_venta,
            p.nombre as producto,
            v.cantidad,
            p.precio as precio_unitario,
            v.monto_total,
            v.metodo_pago
        FROM ventas v
        JOIN productos p ON v.producto_id = p.id
        WHERE $whereVentas
        ORDER BY v.fecha_venta DESC
    ";

    debugLog("Query ventas: " . $queryVentas);

    $stmtVentas = $conn->prepare($queryVentas);
    foreach ($params as $key => $value) {
        $stmtVentas->bindValue($key, $value);
    }
    $stmtVentas->execute();
    $ventas = $stmtVentas->fetchAll(PDO::FETCH_ASSOC);
    debugLog("Ventas encontradas: " . count($ventas));

    // Totales de ventas
    $queryTotalesVentas = "
        SELECT 
            COALESCE(SUM(monto_total), 0) AS total,
            COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto_total ELSE 0 END), 0) AS efectivo,
            COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN monto_total ELSE 0 END), 0) AS tarjeta,
            COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto_total ELSE 0 END), 0) AS transferencia
        FROM ventas
        WHERE $whereVentas
    ";

    $stmtTotalesVentas = $conn->prepare($queryTotalesVentas);
    foreach ($params as $key => $value) {
        $stmtTotalesVentas->bindValue($key, $value);
    }
    $stmtTotalesVentas->execute();
    $totalesVentas = $stmtTotalesVentas->fetch(PDO::FETCH_ASSOC);
    debugLog("Totales ventas: " . json_encode($totalesVentas));

    // 2. CONSULTA DE INSCRIPCIONES DE MIEMBROS
    $queryMiembros = "
        SELECT 
            id,
            CONCAT(nombre, ' ', apellido_paterno, ' ', COALESCE(apellido_materno, '')) as nombre_completo,
            edad,
            sexo,
            fecha_registro,
            monto_inscripcion
        FROM miembros
        WHERE $whereMiembros
        ORDER BY fecha_registro DESC
    ";

    $stmtMiembros = $conn->prepare($queryMiembros);
    foreach ($params as $key => $value) {
        $stmtMiembros->bindValue($key, $value);
    }
    $stmtMiembros->execute();
    $miembros = $stmtMiembros->fetchAll(PDO::FETCH_ASSOC);
    debugLog("Miembros encontrados: " . count($miembros));

    // Totales de inscripciones
    $queryTotalesInscripciones = "
        SELECT 
            COUNT(*) as total_miembros,
            COALESCE(SUM(monto_inscripcion), 0) AS total_ingresos,
            COALESCE(SUM(CASE WHEN sexo = 'M' THEN 1 ELSE 0 END), 0) AS hombres,
            COALESCE(SUM(CASE WHEN sexo = 'F' THEN 1 ELSE 0 END), 0) AS mujeres
        FROM miembros
        WHERE $whereMiembros
    ";

    $stmtTotalesInscripciones = $conn->prepare($queryTotalesInscripciones);
    foreach ($params as $key => $value) {
        $stmtTotalesInscripciones->bindValue($key, $value);
    }
    $stmtTotalesInscripciones->execute();
    $totalesInscripciones = $stmtTotalesInscripciones->fetch(PDO::FETCH_ASSOC);
    debugLog("Totales inscripciones: " . json_encode($totalesInscripciones));

    // 3. CONSULTA DE MOVIMIENTOS DE CAJA
    // Usamos la estructura real de la tabla movimientos_caja
    $queryMovimientos = "
        SELECT 
            id,
            tipo,
            monto,
            motivo,
            fecha_movimiento as fecha
        FROM movimientos_caja
        WHERE $whereMovimientos
        ORDER BY fecha_movimiento DESC
    ";

    debugLog("Query movimientos: " . $queryMovimientos);

    $stmtMovimientos = $conn->prepare($queryMovimientos);
    foreach ($params as $key => $value) {
        $stmtMovimientos->bindValue($key, $value);
    }
    $stmtMovimientos->execute();
    $movimientos = $stmtMovimientos->fetchAll(PDO::FETCH_ASSOC);
    debugLog("Movimientos encontrados: " . count($movimientos));

    // Total de retiros (movimientos de tipo 'egreso')
    $queryTotalRetiros = "
        SELECT COALESCE(SUM(monto), 0) AS total_retiros 
        FROM movimientos_caja 
        WHERE tipo = 'egreso' AND $whereMovimientos
    ";

    $stmtTotalRetiros = $conn->prepare($queryTotalRetiros);
    foreach ($params as $key => $value) {
        $stmtTotalRetiros->bindValue($key, $value);
    }
    $stmtTotalRetiros->execute();
    $retirosSum = $stmtTotalRetiros->fetch(PDO::FETCH_ASSOC);
    debugLog("Total retiros: " . json_encode($retirosSum));

    // 4. ANALÍTICA DE ALTAS Y BAJAS (para el mes)
    $crecimiento = 0;
    $miembrosMesAnterior = 0;

    if ($tipo === 'mes') {
        $mesAnterior = date('Y-m', strtotime($fecha . ' -1 month'));
        $primerDiaMesAnterior = date('Y-m-01', strtotime($mesAnterior));
        $ultimoDiaMesAnterior = date('Y-m-t', strtotime($mesAnterior));

        // Miembros del mes anterior
        $queryMiembrosMesAnterior = "
            SELECT COUNT(*) as total 
            FROM miembros 
            WHERE DATE(fecha_registro) BETWEEN :inicio_anterior AND :fin_anterior
        ";

        $stmtMesAnterior = $conn->prepare($queryMiembrosMesAnterior);
        $stmtMesAnterior->bindValue(':inicio_anterior', $primerDiaMesAnterior);
        $stmtMesAnterior->bindValue(':fin_anterior', $ultimoDiaMesAnterior);
        $stmtMesAnterior->execute();
        $resultMesAnterior = $stmtMesAnterior->fetch(PDO::FETCH_ASSOC);
        $miembrosMesAnterior = $resultMesAnterior['total'] || 0;

        // Calcular crecimiento
        if ($miembrosMesAnterior > 0) {
            $crecimiento = (($totalesInscripciones['total_miembros'] - $miembrosMesAnterior) / $miembrosMesAnterior) * 100;
        }

        debugLog("Miembros mes anterior: " . $miembrosMesAnterior);
        debugLog("Crecimiento: " . $crecimiento . "%");
    }

    // 5. SALDO ACTUAL DE CAJA
    // Verificamos si la tabla saldo_caja existe y tiene la columna correcta
    try {
        $tablaSaldoInfo = $conn->query("DESCRIBE saldo_caja")->fetchAll(PDO::FETCH_ASSOC);
        $columnasSaldo = array_column($tablaSaldoInfo, 'Field');

        if (in_array('saldo_actual', $columnasSaldo)) {
            $querySaldo = "SELECT saldo_actual FROM saldo_caja ORDER BY fecha_actualizacion DESC LIMIT 1";
            $stmtSaldo = $conn->prepare($querySaldo);
            $stmtSaldo->execute();
            $saldo = $stmtSaldo->fetch(PDO::FETCH_ASSOC);
            debugLog("Saldo caja: " . json_encode($saldo));
        } else {
            $saldo = ['saldo_actual' => 0];
            debugLog("Columna saldo_actual no encontrada en saldo_caja");
        }
    } catch (Exception $e) {
        $saldo = ['saldo_actual' => 0];
        debugLog("Error al consultar saldo_caja: " . $e->getMessage());
    }

    // Calcular efectivo en caja
    $efectivoCaja = ($totalesVentas['efectivo'] || 0) + ($totalesInscripciones['total_ingresos'] || 0) - ($retirosSum['total_retiros'] || 0);
    debugLog("Efectivo en caja calculado: " . $efectivoCaja);

    $response = [
        'success' => true,
        'titulo' => $titulo,
        'ventas' => $ventas,
        'miembros' => $miembros,
        'movimientos' => $movimientos,
        'totales' => [
            'ventas' => $totalesVentas,
            'inscripciones' => $totalesInscripciones,
            'efectivo_caja' => $efectivoCaja,
            'saldo_actual' => $saldo['saldo_actual'] || 0,
            'total_retiros' => $retirosSum['total_retiros'] || 0
        ],
        'analitica' => [
            'crecimiento' => $crecimiento,
            'miembros_mes_anterior' => $miembrosMesAnterior
        ]
    ];

    debugLog("Respuesta final preparada");
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    $errorMsg = "Error PDO: " . $e->getMessage();
    logError($errorMsg);
    debugLog($errorMsg);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} catch (Exception $e) {
    $statusCode = $e->getCode() ?: 500;
    http_response_code($statusCode);
    $errorMsg = "Error: " . $e->getMessage();
    logError($errorMsg);
    debugLog($errorMsg);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => [
            'code' => $statusCode,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?>