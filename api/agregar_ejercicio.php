<?php
require_once 'cors.php';
require_once __DIR__ . '/../dao/AuthDAO.php';
require_once __DIR__ . '/../dao/EjercicioDAO.php';
require_once __DIR__ . '/../dao/RecordDAO.php';
require_once __DIR__ . '/../dao/LogroDAO.php';
require_once __DIR__ . '/../dao/BitacoraDAO.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) $action = $input['action'];

$userId = AuthDAO::validarToken($input['token'] ?? $_GET['token'] ?? '');
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido o expirado']);
    exit;
}

if ($action === 'agregar_ejercicio') {
    $nombre = trim($input['exerciseName'] ?? '');
    $peso = (float)($input['weight'] ?? 0);
    $series = (int)($input['series'] ?? 0);
    $reps = (int)($input['reps'] ?? 0);

    if (!$nombre || $peso < 1 || $series < 1 || $reps < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Campos inválidos']);
        exit;
    }

    $volumen = $peso * $series * $reps;
    $ejercicio = EjercicioDAO::insertar($userId, $nombre, $peso, $series, $reps);
    $nuevosRecords = RecordDAO::registrarSiRecord($userId, $nombre, $peso, $series, $reps, (int)$ejercicio['id']);
    $evaluacion = LogroDAO::evaluar($userId);

    BitacoraDAO::registrar((int)$userId, 'AGREGAR EJERCICIO', $nombre . ' · ' . $series . 'x' . $reps . ' · ' . $peso . ' kg');
    if ($nuevosRecords) {
        $desc = array_map(fn($nr) => $nr['tipo'] . ' = ' . $nr['valor'] . ' (' . $nr['nombre_ejercicio'] . ')', $nuevosRecords);
        BitacoraDAO::registrar((int)$userId, 'NUEVO RÉCORD', implode('; ', $desc));
    }
    if ($evaluacion['nuevos']) {
        BitacoraDAO::registrar((int)$userId, 'LOGRO DESBLOQUEADO', implode(', ', $evaluacion['nuevos']));
    }

    echo json_encode([
        'success' => true,
        'volumenTotal' => $volumen,
        'ejercicioId' => (int)$ejercicio['id'],
        'created_at' => $ejercicio['creado_en'],
        'nuevos_records' => $nuevosRecords,
        'nuevos_logros' => array_values(array_filter($evaluacion['logros'], fn($l) => in_array($l['codigo'], $evaluacion['nuevos'], true)))
    ]);
    exit;
}

if ($action === 'listar') {
    echo json_encode([
        'success' => true,
        'ejercicios' => EjercicioDAO::listarRecientes($userId),
        'volumenTotal' => EjercicioDAO::volumenTotal($userId),
        'totalEjercicios' => EjercicioDAO::totalEjercicios($userId)
    ]);
    exit;
}

if ($action === 'eliminar') {
    $id = (int)($input['id'] ?? 0);
    if ($id < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'ID inválido']);
        exit;
    }

    EjercicioDAO::eliminar($id, $userId);
    BitacoraDAO::registrar((int)$userId, 'ELIMINAR EJERCICIO', 'id ' . $id);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'eliminar_todo') {
    EjercicioDAO::eliminarTodo($userId);
    BitacoraDAO::registrar((int)$userId, 'FORMATEAR TABLAS', 'Se borraron todos los ejercicios y récords');
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
exit;