<?php
require_once __DIR__ . '/Conexion.php';

class UsuarioDAO {

    public static function obtenerPorId(int $id): ?array {
        $stmt = Conexion::get()->prepare(
            'SELECT id, nombre, email, peso, edad, altura, genero, objetivo, nivel_experiencia, ' .
            'dias_semana, cuestionario_completado, nivel_progresion_on, xp, nivel FROM usuarios WHERE id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function nivelYProgresion(int $id): ?array {
        $stmt = Conexion::get()->prepare('SELECT nivel, nivel_progresion_on FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function guardarCuestionario(int $id, float $peso, int $edad, float $altura, string $genero, string $objetivo, string $nivel, int $dias): void {
        $stmt = Conexion::get()->prepare(
            'UPDATE usuarios SET peso = ?, edad = ?, altura = ?, genero = ?, objetivo = ?, ' .
            'nivel_experiencia = ?, dias_semana = ?, cuestionario_completado = TRUE WHERE id = ?'
        );
        $stmt->execute([$peso, $edad, $altura, $genero, $objetivo, $nivel, $dias, $id]);
    }

    public static function activarProgresion(int $id, bool $activo): void {
        $stmt = Conexion::get()->prepare('UPDATE usuarios SET nivel_progresion_on = ? WHERE id = ?');
        $stmt->bindValue(1, $activo, PDO::PARAM_BOOL);
        $stmt->bindValue(2, $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    public static function xpYNivel(int $id): ?array {
        $stmt = Conexion::get()->prepare('SELECT xp, nivel FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function guardarXpYNivel(int $id, int $xp, int $nivel): void {
        $stmt = Conexion::get()->prepare('UPDATE usuarios SET xp = ?, nivel = ? WHERE id = ?');
        $stmt->execute([$xp, $nivel, $id]);
    }

    public static function aplicarXp(int $id, int $xpGanado): array {
        $actual = self::xpYNivel($id);
        $xp = $actual ? (int)$actual['xp'] : 0;
        $nivel = $actual ? (int)$actual['nivel'] : 1;
        $nivelAnterior = $nivel;
        $xp += $xpGanado;
        while ($xp >= $nivel * 200) {
            $xp -= $nivel * 200;
            $nivel++;
        }
        self::guardarXpYNivel($id, $xp, $nivel);
        return [
            'xp' => $xp,
            'nivel' => $nivel,
            'subio_nivel' => $nivel > $nivelAnterior,
            'xp_siguiente' => $nivel * 200
        ];
    }
}