<?php
/**
 * Archivo de conexión a la base de datos para Gimnasio Lenin
 * 
 * Este archivo centraliza la configuración y conexión a la base de datos
 * para facilitar el mantenimiento y la consistencia en toda la aplicación.
 */

class Conexion
{
    // Configuración de la base de datos
    private $host = "localhost";
    private $usuario = "root"; // Cambiar por tu usuario de MySQL
    private $password = "Th3b4k3nd"; // Cambiar por tu contraseña de MySQL
    private $base_datos = "gym";
    private $charset = "utf8";

    // Variable para almacenar la conexión
    private $conexion;

    // Instancia única (para patrón Singleton)
    private static $instancia = null;

    /**
     * Constructor privado para implementar patrón Singleton
     */
    private function __construct()
    {
        $this->conectar();
    }

    /**
     * Método para obtener la instancia única de la conexión
     */
    public static function obtenerInstancia()
    {
        if (self::$instancia === null) {
            self::$instancia = new Conexion();
        }
        return self::$instancia;
    }

    /**
     * Establece la conexión con la base de datos
     */
    private function conectar()
    {
        try {
            // Crear conexión usando MySQLi
            $this->conexion = new mysqli(
                $this->host,
                $this->usuario,
                $this->password,
                $this->base_datos
            );

            // Verificar si hay error en la conexión
            if ($this->conexion->connect_error) {
                throw new Exception(
                    "Error de conexión: " . $this->conexion->connect_error
                );
            }

            // Establecer el charset
            if (!$this->conexion->set_charset($this->charset)) {
                throw new Exception(
                    "Error al establecer charset: " . $this->conexion->error
                );
            }

        } catch (Exception $e) {
            // Log del error (en producción, registrar en un archivo de log)
            error_log($e->getMessage());

            // Mostrar mensaje de error genérico (en desarrollo)
            if (getenv('ENVIRONMENT') === 'development') {
                die("Error de conexión a la base de datos: " . $e->getMessage());
            } else {
                die("Error de conexión a la base de datos. Por favor, intente más tarde.");
            }
        }
    }

    /**
     * Obtiene la conexión a la base de datos
     */
    public function obtenerConexion()
    {
        // Verificar si la conexión sigue activa
        if (!$this->conexion || !$this->conexion->ping()) {
            $this->conectar();
        }

        return $this->conexion;
    }

    /**
     * Cierra la conexión a la base de datos
     */
    public function cerrarConexion()
    {
        if ($this->conexion) {
            $this->conexion->close();
        }
    }

    /**
     * Prevenir la clonación (para mantener Singleton)
     */
    private function __clone()
    {
    }

    /**
     * Prevenir la deserialización (para mantener Singleton)
     * Este método debe ser público según los estándares de PHP
     */
    public function __wakeup()
    {
        throw new Exception("No se puede deserializar una conexión singleton");
    }
}

// Función helper para obtener conexión rápidamente
function obtenerConexion()
{
    return Conexion::obtenerInstancia()->obtenerConexion();
}

// Función helper para cerrar conexión
function cerrarConexion()
{
    return Conexion::obtenerInstancia()->cerrarConexion();
}
?>