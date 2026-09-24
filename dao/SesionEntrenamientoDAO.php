<?php
require_once __DIR__ . '/Conexion.php';

class SesionEntrenamientoDAO {

    public static function crear(int $uid, int $plantillaId, int $nivelPrev, array $ejercicios, float $factorNivel): int {
        $pdo = Conexion::get();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO sesiones_entrenamiento (usuario_id, plantilla_id, nivel_previo) VALUES (?, ?, ?)');
            $stmt->execute([$uid, $plantillaId, $nivelPrev]);
            $sesionId = (int)$pdo->lastInsertId();

            $stmt = $pdo->prepare('INSERT INTO sesion_ejercicios (sesion_id, plantilla_ejercicio_id, ejercicio_catalogo_id, peso_usado) VALUES (?, ?, ?, ?)');
            foreach ($ejercicios as $e) {
                $pesoAjustado = round((float)$e['peso_base'] * $factorNivel, 1);
                $stmt->execute([$sesionId, $e['id'], $e['ejercicio_catalogo_id'], $pesoAjustado]);
            }
            $pdo->commit();
            return $sesionId;
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function obtener(int $sesionId, int $uid): ?array {
        $stmt = Conexion::get()->prepare('SELECT * FROM sesiones_entrenamiento WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$sesionId, $uid]);
        $sesion = $stmt->fetch();
        if (!$sesion) return null;
        $sesion['ejercicios'] = self::ejerciciosDe($sesionId);
        $sesion['plantilla_nombre'] = self::nombrePlantilla((int)$sesion['plantilla_id']);
        return $sesion;
    }

    public static function ejerciciosDe(int $sesionId): array {
        $stmt = Conexion::get()->prepare(
            'SELECT se.*, c.nombre, c.grupo_muscular, c.foto_url, c.descripcion, c.pasos, ' .
            'COALESCE(c.nombre, pe.nombre_manual) AS nombre_ejercicio ' .
            'FROM sesion_ejercicios se ' .
            'LEFT JOIN ejercicios_catalogo c ON c.id = se.ejercicio_catalogo_id ' .
            'LEFT JOIN plantilla_ejercicios pe ON pe.id = se.plantilla_ejercicio_id ' .
            'WHERE se.sesion_id = ? ORDER BY se.id'
        );
        $stmt->execute([$sesionId]);
        return $stmt->fetchAll();
    }

    public static function nombrePlantilla(int $plantillaId): string {
        $stmt = Conexion::get()->prepare('SELECT nombre FROM plantillas WHERE id = ?');
        $stmt->execute([$plantillaId]);
        $row = $stmt->fetch();
        return $row ? $row['nombre'] : '';
    }

    public static function verificarAcceso(int $sesionEjercicioId, int $uid): bool {
        $stmt = Conexion::get()->prepare(
            'SELECT se2.id FROM sesion_ejercicios se2 ' .
            'INNER JOIN sesiones_entrenamiento s ON s.id = se2.sesion_id ' .
            'WHERE se2.id = ? AND s.usuario_id = ?'
        );
        $stmt->execute([$sesionEjercicioId, $uid]);
        return $stmt->fetch() !== false;
    }

    public static function marcarCompletado(int $sesionEjercicioId, int $series, string $reps, float $peso): void {
        $stmt = Conexion::get()->prepare(
            'UPDATE sesion_ejercicios SET series_completadas = ?, reps_completadas = ?, peso_usado = ?, ' .
            'completado = TRUE, descanso_activo = FALSE, momento_inicio = NOW() WHERE id = ?'
        );
        $stmt->execute([$series, $reps, $peso, $sesionEjercicioId]);
    }

    public static function ejercicioCatalogoId(int $sesionEjercicioId): ?int {
        $stmt = Conexion::get()->prepare('SELECT ejercicio_catalogo_id FROM sesion_ejercicios WHERE id = ?');
        $stmt->execute([$sesionEjercicioId]);
        $row = $stmt->fetch();
        return $row ? (int)$row['ejercicio_catalogo_id'] : null;
    }

    public static function iniciarDescanso(int $sesionEjercicioId): void {
        $stmt = Conexion::get()->prepare('UPDATE sesion_ejercicios SET descanso_activo = TRUE, momento_inicio = NOW() WHERE id = ? AND completado = TRUE');
        $stmt->execute([$sesionEjercicioId]);
    }

    public static function finDescanso(int $sesionEjercicioId): void {
        $stmt = Conexion::get()->prepare('UPDATE sesion_ejercicios SET descanso_activo = FALSE WHERE id = ?');
        $stmt->execute([$sesionEjercicioId]);
    }

    public static function finalizar(int $sesionId, int $uid, int $xp, int $nivelNuevo): void {
        $stmt = Conexion::get()->prepare('UPDATE sesiones_entrenamiento SET fecha_fin = NOW(), completada = TRUE, xp_ganado = ? WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$xp, $sesionId, $uid]);
        $stmt = Conexion::get()->prepare('UPDATE sesiones_entrenamiento SET nivel_nuevo = ? WHERE id = ?');
        $stmt->execute([$nivelNuevo, $sesionId]);
    }
}