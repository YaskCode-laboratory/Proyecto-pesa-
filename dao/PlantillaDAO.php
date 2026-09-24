<?php
require_once __DIR__ . '/Conexion.php';

class PlantillaDAO {

    public static function listar(int $uid): array {
        $stmt = Conexion::get()->prepare(
            'SELECT p.*, COUNT(pe.id) AS num_ejercicios FROM plantillas p ' .
            'LEFT JOIN plantilla_ejercicios pe ON pe.plantilla_id = p.id ' .
            'WHERE p.es_sistema = TRUE OR p.usuario_id = ? ' .
            'GROUP BY p.id ORDER BY p.es_sistema DESC, p.nombre'
        );
        $stmt->execute([$uid]);
        return $stmt->fetchAll();
    }

    public static function buscarAccesible(int $plantillaId, int $uid): ?array {
        $stmt = Conexion::get()->prepare('SELECT * FROM plantillas WHERE id = ? AND (es_sistema = TRUE OR usuario_id = ?)');
        $stmt->execute([$plantillaId, $uid]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function buscarConEjercicios(int $plantillaId, int $uid): ?array {
        $plantilla = self::buscarAccesible($plantillaId, $uid);
        if (!$plantilla) return null;
        $plantilla['ejercicios'] = self::ejerciciosDe($plantillaId);
        return $plantilla;
    }

    public static function ejerciciosDe(int $plantillaId): array {
        $stmt = Conexion::get()->prepare(
            'SELECT pe.*, c.nombre, c.grupo_muscular, c.descripcion, c.foto_url, c.pasos, ' .
            'COALESCE(c.nombre, pe.nombre_manual) AS nombre_ejercicio ' .
            'FROM plantilla_ejercicios pe ' .
            'LEFT JOIN ejercicios_catalogo c ON c.id = pe.ejercicio_catalogo_id ' .
            'WHERE pe.plantilla_id = ? ORDER BY pe.orden'
        );
        $stmt->execute([$plantillaId]);
        return $stmt->fetchAll();
    }

    public static function crear(string $nombre, string $descripcion, string $tipo, string $nivel, int $uid, int $dias, array $ejercicios): int {
        $pdo = Conexion::get();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, usuario_id, dias_por_semana) ' .
                'VALUES (?, ?, ?, ?, FALSE, ?, ?)'
            );
            $stmt->execute([$nombre, $descripcion, $tipo, $nivel, $uid, $dias]);
            $plantillaId = (int)$pdo->lastInsertId();

            $stmt = $pdo->prepare(
                'INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos) ' .
                'VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            foreach ($ejercicios as $i => $e) {
                $stmt->execute([
                    $plantillaId,
                    (int)($e['ejercicio_id'] ?? 0),
                    (int)($e['series'] ?? 3),
                    $e['reps'] ?? '10',
                    (float)($e['peso'] ?? 0),
                    $i + 1,
                    (int)($e['descanso'] ?? 90)
                ]);
            }
            $pdo->commit();
            return $plantillaId;
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function eliminar(int $plantillaId, int $uid): bool {
        $stmt = Conexion::get()->prepare('DELETE FROM plantillas WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$plantillaId, $uid]);
        return $stmt->rowCount() > 0;
    }

    public static function activa(int $uid): ?array {
        $stmt = Conexion::get()->prepare(
            'SELECT p.* FROM plantillas p INNER JOIN sesiones_entrenamiento s ON s.plantilla_id = p.id ' .
            'WHERE s.usuario_id = ? ORDER BY s.fecha_inicio DESC LIMIT 1'
        );
        $stmt->execute([$uid]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function catalogo(string $grupo = ''): array {
        $pdo = Conexion::get();
        if ($grupo !== '') {
            $stmt = $pdo->prepare('SELECT * FROM ejercicios_catalogo WHERE grupo_muscular = ? ORDER BY nombre');
            $stmt->execute([$grupo]);
        } else {
            $stmt = $pdo->query('SELECT * FROM ejercicios_catalogo ORDER BY grupo_muscular, nombre');
        }
        return $stmt->fetchAll();
    }
}