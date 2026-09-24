<?php
require_once __DIR__ . '/Conexion.php';

class AuthDAO {

    public static function existeEmail(string $email): bool {
        $stmt = Conexion::get()->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetch() !== false;
    }

    public static function crearUsuario(string $email, string $hash, string $nombre): array {
        $stmt = Conexion::get()->prepare('INSERT INTO usuarios (email, password, nombre) VALUES (?, ?, ?) RETURNING id, nombre');
        $stmt->execute([$email, $hash, $nombre]);
        return $stmt->fetch();
    }

    public static function buscarPorEmail(string $email): ?array {
        $stmt = Conexion::get()->prepare('SELECT id, password, nombre FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function crearSesion(int $usuarioId, string $token, string $expires): void {
        $stmt = Conexion::get()->prepare('INSERT INTO sesiones (usuario_id, token, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$usuarioId, $token, $expires]);
    }

    public static function validarToken(?string $token): ?int {
        if (!$token) return null;
        $stmt = Conexion::get()->prepare('SELECT usuario_id FROM sesiones WHERE token = ? AND expires_at > NOW()');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        return $row ? (int)$row['usuario_id'] : null;
    }

    public static function usuarioPorToken(string $token): ?array {
        $stmt = Conexion::get()->prepare('SELECT u.id, u.nombre FROM usuarios u JOIN sesiones s ON u.id = s.usuario_id WHERE s.token = ? AND s.expires_at > NOW()');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function eliminarSesion(string $token): void {
        $stmt = Conexion::get()->prepare('DELETE FROM sesiones WHERE token = ?');
        $stmt->execute([$token]);
    }

    public static function buscarIdPorEmail(string $email): ?int {
        $stmt = Conexion::get()->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ? (int)$row['id'] : null;
    }

    public static function borrarResets(int $usuarioId): void {
        $stmt = Conexion::get()->prepare('DELETE FROM password_resets WHERE usuario_id = ?');
        $stmt->execute([$usuarioId]);
    }

    public static function crearReset(int $usuarioId, string $token, string $expires): void {
        $stmt = Conexion::get()->prepare('INSERT INTO password_resets (usuario_id, token, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$usuarioId, $token, $expires]);
    }

    public static function resetValido(string $token): ?int {
        $stmt = Conexion::get()->prepare('SELECT usuario_id FROM password_resets WHERE token = ? AND expires_at > NOW() AND usado = FALSE');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        return $row ? (int)$row['usuario_id'] : null;
    }

    public static function actualizarPassword(int $usuarioId, string $hash): void {
        $stmt = Conexion::get()->prepare('UPDATE usuarios SET password = ? WHERE id = ?');
        $stmt->execute([$hash, $usuarioId]);
    }

    public static function marcarResetUsado(string $token): void {
        $stmt = Conexion::get()->prepare('UPDATE password_resets SET usado = TRUE WHERE token = ?');
        $stmt->execute([$token]);
    }
}