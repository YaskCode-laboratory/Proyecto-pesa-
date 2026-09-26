<?php
// Configuracion de la base de datos.
// Las credenciales se leen del archivo .env (junto a este folder),
// que NO se sube al repositorio. Nunca pongas contrasenas aqui.

function _cargar_env($archivo)
{
    $env = [];
    if (!file_exists($archivo)) {
        return $env;
    }
    $lineas = file($archivo, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lineas as $linea) {
        $linea = trim($linea);
        if ($linea === '' || strpos($linea, '#') === 0 || strpos($linea, '=') === false) {
            continue;
        }
        list($clave, $valor) = explode('=', $linea, 2);
        $env[trim($clave)] = trim($valor);
    }
    return $env;
}

$env = _cargar_env(__DIR__ . '/../.env');

return [
    'host' => $env['DB_HOST'] ?? 'localhost',
    'port' => (int)($env['DB_PORT'] ?? 5432),
    'db'   => $env['DB_NAME'] ?? 'pesas',
    'user' => $env['DB_USER'] ?? 'postgres',
    'pass' => $env['DB_PASS'] ?? '',
];