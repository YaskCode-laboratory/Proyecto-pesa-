<?php
require_once __DIR__ . '/Conexion.php';

class RecordDAO {

    public static function normalizar(string $nombre): string {
        $s = strtolower(strtr(trim($nombre), [
            'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u', 'Ñ' => 'n',
            'À' => 'a', 'È' => 'e', 'Ì' => 'i', 'Ò' => 'o', 'Ù' => 'u',
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
        ]));
        return preg_replace('/\s+/', ' ', $s);
    }

    private static function metricas(float $peso, int $series, int $reps): array {
        return [
            'peso_maximo'    => round($peso, 2),
            'volumen_maximo' => round($peso * $series * $reps, 2),
            'rm1'            => round($peso * (1 + $reps / 30), 2),
            'mejor_serie'    => round($peso * $reps, 2),
        ];
    }

    public static function registrarSiRecord(int $uid, string $nombre, float $peso, int $series, int $reps, int $ejercicioId): array {
        $nombreNorm = self::normalizar($nombre);
        $stmt = Conexion::get()->prepare('SELECT nombre, peso, series, reps FROM ejercicios WHERE usuario_id = ? AND id <> ?');
        $stmt->execute([$uid, $ejercicioId]);

        $previos = ['peso_maximo' => 0, 'volumen_maximo' => 0, 'rm1' => 0, 'mejor_serie' => 0];
        foreach ($stmt->fetchAll() as $row) {
            if (self::normalizar($row['nombre']) !== $nombreNorm) continue;
            $m = self::metricas((float)$row['peso'], (int)$row['series'], (int)$row['reps']);
            foreach ($previos as $tipo => $valor) {
                if ($m[$tipo] > $previos[$tipo]) $previos[$tipo] = $m[$tipo];
            }
        }

        $nuevos = self::metricas($peso, $series, $reps);
        $batidos = [];
        $insert = Conexion::get()->prepare(
            'INSERT INTO historial (usuario_id, nombre_ejercicio, tipo, valor, peso, series, reps) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($nuevos as $tipo => $valor) {
            if ($valor > $previos[$tipo]) {
                $insert->execute([$uid, trim($nombre), $tipo, $valor, $peso, $series, $reps]);
                $batidos[] = ['tipo' => $tipo, 'valor' => $valor, 'anterior' => $previos[$tipo]];
            }
        }
        return $batidos;
    }

    public static function listarRecords(int $uid): array {
        $stmt = Conexion::get()->prepare('SELECT nombre, peso, series, reps, creado_en FROM ejercicios WHERE usuario_id = ?');
        $stmt->execute([$uid]);

        $grupos = [];
        foreach ($stmt->fetchAll() as $row) {
            $clave = self::normalizar($row['nombre']);
            $m = self::metricas((float)$row['peso'], (int)$row['series'], (int)$row['reps']);
            if (!isset($grupos[$clave])) {
                $grupos[$clave] = [
                    'ejercicio' => trim($row['nombre']),
                    'peso_maximo' => 0, 'reps_peso_maximo' => 0,
                    'volumen_maximo' => 0, 'rm1' => 0, 'mejor_serie' => 0,
                    'fecha' => $row['creado_en'], 'registros' => 0,
                ];
            }
            $g = &$grupos[$clave];
            $g['registros']++;
            if ((float)$row['peso'] > $g['peso_maximo']) {
                $g['peso_maximo'] = (float)$row['peso'];
                $g['reps_peso_maximo'] = (int)$row['reps'];
            }
            if ($m['volumen_maximo'] > $g['volumen_maximo']) $g['volumen_maximo'] = $m['volumen_maximo'];
            if ($m['rm1'] > $g['rm1']) $g['rm1'] = $m['rm1'];
            if ($m['mejor_serie'] > $g['mejor_serie']) $g['mejor_serie'] = $m['mejor_serie'];
            if ($row['creado_en'] > $g['fecha']) $g['fecha'] = $row['creado_en'];
            unset($g);
        }

        $lista = array_values($grupos);
        usort($lista, fn($a, $b) => strcmp($a['ejercicio'], $b['ejercicio']));
        return $lista;
    }

    public static function racha(int $uid): array {
        $stmt = Conexion::get()->prepare(
            'SELECT DISTINCT DATE(creado_en)::text AS dia FROM ejercicios WHERE usuario_id = ? ORDER BY dia'
        );
        $stmt->execute([$uid]);
        $dias = array_map(fn($r) => $r['dia'], $stmt->fetchAll());
        if (!$dias) return ['actual' => 0, 'mejor' => 0];

        $hoy = Conexion::get()->query('SELECT CURRENT_DATE::text AS hoy')->fetch()['hoy'];
        $aTs = fn(string $d) => (new DateTimeImmutable($d))->getTimestamp();

        $mejor = 1;
        $run = 1;
        for ($i = 1; $i < count($dias); $i++) {
            if ($aTs($dias[$i]) - $aTs($dias[$i - 1]) === 86400) $run++;
            else $run = 1;
            if ($run > $mejor) $mejor = $run;
        }

        $hoyTs = $aTs($hoy);
        $ultimo = $aTs($dias[count($dias) - 1]);
        $actual = 0;
        if ($ultimo === $hoyTs || $ultimo === $hoyTs - 86400) {
            $actual = 1;
            for ($i = count($dias) - 1; $i > 0; $i--) {
                if ($aTs($dias[$i]) - $aTs($dias[$i - 1]) === 86400) $actual++;
                else break;
            }
        }

        return ['actual' => $actual, 'mejor' => $mejor];
    }

    public static function totalRecords(int $uid): int {
        $stmt = Conexion::get()->prepare('SELECT COUNT(*) AS total FROM historial WHERE usuario_id = ?');
        $stmt->execute([$uid]);
        return (int)$stmt->fetch()['total'];
    }
}
