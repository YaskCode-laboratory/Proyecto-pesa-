<?php
require_once __DIR__ . '/Conexion.php';
require_once __DIR__ . '/RecordDAO.php';

class LogroDAO {

    private const DEFINICIONES = [
        ['codigo' => 'primer_entreno',  'titulo' => 'Primer paso',       'desc' => 'Registra tu primer ejercicio',            'icono' => '🎯', 'tipo' => 'ejercicios', 'meta' => 1],
        ['codigo' => 'racha_3',         'titulo' => '3 días en racha',   'desc' => 'Entrena 3 días seguidos',                 'icono' => '🔥', 'tipo' => 'racha',      'meta' => 3],
        ['codigo' => 'racha_7',         'titulo' => 'Semana activa',     'desc' => 'Entrena 7 días seguidos',                 'icono' => '⚡', 'tipo' => 'racha',      'meta' => 7],
        ['codigo' => 'racha_14',        'titulo' => 'Quincena sólida',   'desc' => 'Entrena 14 días seguidos',                'icono' => '💥', 'tipo' => 'racha',      'meta' => 14],
        ['codigo' => 'racha_30',        'titulo' => 'Mes de hierro',     'desc' => 'Entrena 30 días seguidos',                'icono' => '🏔️', 'tipo' => 'racha',      'meta' => 30],
        ['codigo' => 'volumen_1000',    'titulo' => '1.000 kg',          'desc' => 'Acumula 1.000 kg levantados',             'icono' => '💪', 'tipo' => 'volumen',    'meta' => 1000],
        ['codigo' => 'volumen_5000',    'titulo' => '5.000 kg',          'desc' => 'Acumula 5.000 kg levantados',             'icono' => '🦾', 'tipo' => 'volumen',    'meta' => 5000],
        ['codigo' => 'volumen_10000',   'titulo' => '10.000 kg',         'desc' => 'Acumula 10.000 kg levantados',            'icono' => '🚀', 'tipo' => 'volumen',    'meta' => 10000],
        ['codigo' => 'volumen_25000',   'titulo' => '25.000 kg',         'desc' => 'Acumula 25.000 kg levantados',            'icono' => '🐉', 'tipo' => 'volumen',    'meta' => 25000],
        ['codigo' => 'ejercicios_10',   'titulo' => 'Constante',         'desc' => 'Registra 10 ejercicios',                  'icono' => '📈', 'tipo' => 'ejercicios', 'meta' => 10],
        ['codigo' => 'ejercicios_50',   'titulo' => 'Veterano',          'desc' => 'Registra 50 ejercicios',                  'icono' => '🎖️', 'tipo' => 'ejercicios', 'meta' => 50],
        ['codigo' => 'ejercicios_100',  'titulo' => 'Centenario',        'desc' => 'Registra 100 ejercicios',                 'icono' => '👑', 'tipo' => 'ejercicios', 'meta' => 100],
        ['codigo' => 'nivel_5',         'titulo' => 'Nivel 5',           'desc' => 'Alcanza el nivel 5',                      'icono' => '🏅', 'tipo' => 'nivel',      'meta' => 5],
        ['codigo' => 'nivel_10',        'titulo' => 'Nivel 10',          'desc' => 'Alcanza el nivel 10',                     'icono' => '🥇', 'tipo' => 'nivel',      'meta' => 10],
        ['codigo' => 'primer_record',   'titulo' => 'Rompehielos',       'desc' => 'Bate tu primer récord',                   'icono' => '🏆', 'tipo' => 'records',    'meta' => 1],
        ['codigo' => 'records_10',      'titulo' => 'Cazador de récords','desc' => 'Bate 10 récords personales',              'icono' => '🌟', 'tipo' => 'records',    'meta' => 10],
    ];

    public static function definiciones(): array {
        return self::DEFINICIONES;
    }

    private static function stats(int $uid): array {
        $stmt = Conexion::get()->prepare('SELECT COUNT(*) AS total, COALESCE(SUM(peso * series * reps), 0) AS volumen FROM ejercicios WHERE usuario_id = ?');
        $stmt->execute([$uid]);
        $fila = $stmt->fetch();

        $stmt = Conexion::get()->prepare('SELECT nivel FROM usuarios WHERE id = ?');
        $stmt->execute([$uid]);
        $nivel = (int)($stmt->fetch()['nivel'] ?? 1);

        $racha = RecordDAO::racha($uid);

        return [
            'ejercicios' => (int)$fila['total'],
            'volumen'    => (float)$fila['volumen'],
            'nivel'      => $nivel,
            'records'    => RecordDAO::totalRecords($uid),
            'racha'      => $racha['actual'],
            'mejor_racha' => $racha['mejor'],
        ];
    }

    private static function desbloqueados(int $uid): array {
        $stmt = Conexion::get()->prepare('SELECT codigo, desbloqueado_en FROM logros WHERE usuario_id = ?');
        $stmt->execute([$uid]);
        $mapa = [];
        foreach ($stmt->fetchAll() as $r) $mapa[$r['codigo']] = $r['desbloqueado_en'];
        return $mapa;
    }

    public static function evaluar(int $uid): array {
        $stats = self::stats($uid);
        $desbloqueados = self::desbloqueados($uid);
        $insert = Conexion::get()->prepare(
            'INSERT INTO logros (usuario_id, codigo) VALUES (?, ?) ON CONFLICT (usuario_id, codigo) DO NOTHING RETURNING desbloqueado_en'
        );

        $logros = [];
        $nuevos = [];
        foreach (self::DEFINICIONES as $d) {
            $valor = $stats[$d['tipo']] ?? 0;
            $desbloqueado = isset($desbloqueados[$d['codigo']]);
            if (!$desbloqueado && $valor >= $d['meta']) {
                $insert->execute([$uid, $d['codigo']]);
                $fila = $insert->fetch();
                $desbloqueados[$d['codigo']] = $fila ? $fila['desbloqueado_en'] : date('Y-m-d H:i:s');
                $nuevos[] = $d['codigo'];
                $desbloqueado = true;
            }
            $logros[] = [
                'codigo'       => $d['codigo'],
                'titulo'       => $d['titulo'],
                'desc'         => $d['desc'],
                'icono'        => $d['icono'],
                'meta'         => $d['meta'],
                'valor'        => $valor,
                'progreso'     => min($valor, $d['meta']),
                'desbloqueado' => $desbloqueado,
                'fecha'        => $desbloqueados[$d['codigo']] ?? null,
            ];
        }
        return ['logros' => $logros, 'nuevos' => $nuevos, 'stats' => $stats];
    }
}
