<?php
require_once 'cors.php';
require_once __DIR__ . '/../dao/AuthDAO.php';
require_once __DIR__ . '/../dao/PlantillaDAO.php';
require_once __DIR__ . '/../dao/BitacoraDAO.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) $action = $input['action'];

if ($action === 'listar') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    echo json_encode(['success' => true, 'plantillas' => PlantillaDAO::listar($uid)]);
    exit;
}

if ($action === 'obtener') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $plantillaId = (int)($input['plantilla_id'] ?? 0);
    if (!$plantillaId) { http_response_code(400); echo json_encode(['error' => 'plantilla_id requerido']); exit; }

    $plantilla = PlantillaDAO::buscarConEjercicios($plantillaId, $uid);
    if (!$plantilla) { http_response_code(404); echo json_encode(['error' => 'Plantilla no encontrada']); exit; }

    echo json_encode(['success' => true, 'plantilla' => $plantilla]);
    exit;
}

if ($action === 'crear') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $nombre = trim($input['nombre'] ?? '');
    $tipo = trim($input['tipo'] ?? 'gym_full');
    $nivel = trim($input['nivel'] ?? 'intermedio');
    $ejercicios = $input['ejercicios'] ?? [];

    if (!$nombre || empty($ejercicios)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre y ejercicios son obligatorios']);
        exit;
    }

    $dias = (int)($input['dias_por_semana'] ?? 3);
    try {
        $plantillaId = PlantillaDAO::crear($nombre, $input['descripcion'] ?? '', $tipo, $nivel, $uid, $dias, $ejercicios);
        BitacoraDAO::registrar((int)$uid, 'CREAR PLANTILLA', $nombre . ' · ' . count($ejercicios) . ' ejercicios · ' . $tipo);
        echo json_encode(['success' => true, 'plantilla_id' => $plantillaId]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'eliminar') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $plantillaId = (int)($input['plantilla_id'] ?? 0);
    try {
        $eliminada = PlantillaDAO::eliminar($plantillaId, $uid);
    } catch (PDOException $e) {
        http_response_code(409);
        echo json_encode(['error' => 'No se puede eliminar: la plantilla ya fue usada en sesiones de entrenamiento']);
        exit;
    }
    if ($eliminada) {
        BitacoraDAO::registrar((int)$uid, 'ELIMINAR PLANTILLA', 'plantilla_id ' . $plantillaId);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'No se pudo eliminar (solo plantillas propias)']);
    }
    exit;
}

if ($action === 'activa') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    echo json_encode(['success' => true, 'activa' => PlantillaDAO::activa($uid)]);
    exit;
}

if ($action === 'catalogo') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $grupo = $_GET['grupo'] ?? $input['grupo'] ?? '';
    echo json_encode(['success' => true, 'catalogo' => PlantillaDAO::catalogo($grupo)]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
exit;