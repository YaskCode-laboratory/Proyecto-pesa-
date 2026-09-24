<?php
class Conexion {

    private static ?PDO $instancia = null;

    private function __construct() {}

    private function __clone() {}

    public static function get(): PDO {
        if (self::$instancia === null) {
            $cfg = include __DIR__ . '/../api/config.php';
            $dsn = "pgsql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['db']}";
            self::$instancia = new PDO($dsn, $cfg['user'], $cfg['pass']);
            self::$instancia->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$instancia->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            self::$instancia->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        }
        return self::$instancia;
    }
}