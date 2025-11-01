<?php
session_start();

// Evitar caché del navegador
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Configuración de conexión
$host = 'localhost';
$db = 'gym';
$user = 'root';
$pass = 'Th3b4k3nd';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}

$mensaje = '';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Validar y limpiar datos de entrada
    $usuario = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_STRING);
    $clave = $_POST['password'] ?? '';

    // Validar que el usuario no esté vacío
    if (empty($usuario)) {
        $mensaje = "⚠️ Por favor, ingresa un nombre de usuario.";
    } else {
        // Consulta preparada para evitar inyecciones SQL
        $stmt = $pdo->prepare("SELECT id_empleado, nombre, contrasena, tipo FROM empleados WHERE usuario = ?");
        $stmt->execute([$usuario]);
        $user_data = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verificar si el usuario existe
        if ($user_data) {
            // Verificar la contraseña (asumiendo que está hasheada con SHA256)
            $clave_hasheada = hash('sha256', $clave);

            if ($clave_hasheada === $user_data['contrasena']) {
                // Establecer variables de sesión
                $_SESSION['empleado_id'] = $user_data['id_empleado'];
                $_SESSION['empleado_nombre'] = $user_data['nombre'];
                $_SESSION['empleado_tipo'] = $user_data['tipo'];

                // Redirigir según el tipo de empleado
                if ($user_data['tipo'] === 'administrativo') {
                    header("Location: http://localhost/gimnasio/DASHBOARD/VENTAS.html");
                    exit;
                } else if ($user_data['tipo'] === 'venta') {
                    header("Location: http://localhost/gimnasio/DASHBOARD/VENTAS.html");
                    exit;
                } else {
                    $mensaje = "⚠️ No tienes permisos para acceder al sistema.";
                }
            } else {
                $mensaje = "⚠️ Contraseña incorrecta.";
            }
        } else {
            $mensaje = "⚠️ Credenciales inválidas.";
        }
    }
}
?>


<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Empleados</title>
    <link rel="stylesheet" href="CSS/CSS_EMP.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="icon" type="image/png" sizes="64x64" href="IMAGES/pizza.ico">
</head>

<body>
    <img src="IMAGES/hamburguesa.ico" alt="Agave decoration" class="agave-decoration agave-1 floating"
        style="animation-delay: 0s;" />
    <img src="IMAGES/pizza.ico" alt="Agave decoration" class="agave-decoration agave-2 floating"
        style="animation-delay: 2s;" />

    <div class="login-container">
        <div class="glass-effect"></div>
        <div class="logo">
            <h1>GYM</h1>
            <p>Un cuerpo sano es salud</p>
            <img src="IMAGES/GOKU.png" alt="Logo" class="logo-img" />
        </div>

        <form action="<?= htmlspecialchars($_SERVER['PHP_SELF']) ?>" method="POST" autocomplete="off">
            <div class="input-group">
                <i class="fas fa-user"></i>
                <input type="text" id="username" name="username" placeholder="Nombre de usuario" required
                    autocomplete="username" />
            </div>

            <div class="input-group">
                <i class="fas fa-lock"></i>
                <input type="password" id="password" name="password" placeholder="Contraseña" required
                    autocomplete="current-password" />
            </div>

            <button type="submit" class="btn-login">Ingresar</button>
        </form>

        <?php if (!empty($mensaje)): ?>
            <div class="error-message" style="color: red; margin-top: 15px; text-align: center; font-weight: bold;">
                <?= htmlspecialchars($mensaje) ?>
            </div>
        <?php endif; ?>

        <p class="footer-text">Cuenta de Empleados</p>
    </div>

    <script src="JAVA_SCRIPT/JAVA_LOGGIN.js"></script>
</body>

</html>