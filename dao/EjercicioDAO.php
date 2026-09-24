<?php
require_once __DIR__ . '/Conexion.php';

class EjercicioDAO {

    public static function insertar(int $uid, string $nombre, float $peso, int $series, int $reps): array {
        $stmt = Conexion::get()->prepare('INSERT INTO ejercicios (usuario_id, nombre, peso, series, reps) VALUES (?, ?, ?, ?, ?) RETURNING id, creado_en');
        $stmt->execute([$uid, $nombre, $peso, $series, $reps]);
        return $stmt->fetch();
    }

    public static function nombreCatalogo(int $catalogoId): ?string {
        $stmt = Conexion::get()->prepare('SELECT nombre FROM ejercicios_catalogo WHERE id = ?');
        $stmt->execute([$catalogoId]);
        $row = $stmt->fetch();
        return $row ? $row['nombre'] : null;
    }

    public static function listarRecientes(int $uid): array {
        $stmt = Conexion::get()->prepare('SELECT id, nombre, peso, series, reps, creado_en FROM ejercicios WHERE usuario_id = ? ORDER BY creado_en DESC LIMIT 50');
        $stmt->execute([$uid]);
        return $stmt->fetchAll();
    }

    public static function volumenTotal(int $uid): float {
        $stmt = Conexion::get()->prepare('SELECT COALESCE(SUM(peso * series * reps), 0) AS total FROM ejercicios WHERE usuario_id = ?');
        $stmt->execute([$uid]);
        return (float)$stmt->fetch()['total'];
    }

    public static function totalEjercicios(int $uid): int {
        $stmt = Conexion::get()->prepare('SELECT COUNT(*) AS total FROM ejercicios WHERE usuario_id = ?');
        $stmt->execute([$uid]);
        return (int)$stmt->fetch()['total'];
    }

    public static function eliminar(int $id, int $uid): void {
        $stmt = Conexion::get()->prepare('DELETE FROM ejercicios WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$id, $uid]);
    }

    public static function eliminarTodo(int $uid): void {
        $pdo = Conexion::get();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('DELETE FROM ejercicios WHERE usuario_id = ?')->execute([$uid]);
            $pdo->prepare('DELETE FROM historial WHERE usuario_id = ?')->execute([$uid]);
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}