<?php
require_once __DIR__ . '/Conexion.php';

class BitacoraDAO {

    private const RUTA = __DIR__ . '/../../logs/actividad.log';

    public static function registrar(int $uid, string $accion, string $detalle = ''): void {
        $email = '';
        try {
            $stmt = Conexion::get()->prepare('SELECT email FROM usuarios WHERE id = ?');
            $stmt->execute([$uid]);
            $row = $stmt->fetch();
            $email = $row ? (string)$row['email'] : '';
        } catch (Throwable $e) {
            $email = '';
        }
        self::escribir($uid, $email, $accion, $detalle);
    }

    public static function registrarAnonimo(string $accion, string $detalle = ''): void {
        self::escribir(null, '', $accion, $detalle);
    }

    public static function listar(int $limite = 200, ?int $uidFiltro = null): array {
        if (!is_file(self::RUTA)) return [];
        $lineas = @file(self::RUTA, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lineas === false) return [];
        $salida = [];
        foreach (array_reverse($lineas) as $linea) {
            $partes = explode(' | ', $linea, 5);
            $usuarioId = isset($partes[1]) ? ltrim((string)$partes[1], 'U') : 'sistema';
            if ($uidFiltro !== null && $usuarioId !== (string)$uidFiltro) continue;
            $salida[] = [
                'fecha'      => $partes[0] ?? $linea,
                'usuario_id' => $usuarioId,
                'email'      => $partes[2] ?? '',
                'accion'     => $partes[3] ?? '',
                'detalle'    => $partes[4] ?? ''
            ];
            if (count($salida) >= $limite) break;
        }
        return $salida;
    }

    private static function escribir(?int $uid, string $email, string $accion, string $detalle): void {
        $zona = date_default_timezone_get();
        date_default_timezone_set('America/Caracas');
        $fecha = date('Y-m-d H:i:s');
        date_default_timezone_set($zona);
        $usuario = $uid === null ? 'sistema' : 'U' . $uid;
        $detalleLimpio = strtr((string)$detalle, ["\n" => ' ', "\r" => ' ']);
        $linea = sprintf("%s | %s | %s | %s | %s" . PHP_EOL, $fecha, $usuario, $email, $accion, $detalleLimpio);
        @file_put_contents(self::RUTA, $linea, FILE_APPEND | LOCK_EX);
    }
}