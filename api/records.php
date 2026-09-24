<?php
require_once 'cors.php';
require_once __DIR__ . '/../dao/AuthDAO.php';
require_once __DIR__ . '/../dao/RecordDAO.php';
require_once __DIR__ . '/../dao/LogroDAO.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) $action = $input['action'];

$uid = AuthDAO::validarToken($input['token'] ?? $_GET['token'] ?? '');
if (!$uid) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido o expirado']);
    exit;
}

if ($action === 'listar') {
    $evaluacion = LogroDAO::evaluar($uid);
    echo json_encode([
        'success' => true,
        'records' => RecordDAO::listarRecords($uid),
        'racha'   => RecordDAO::racha($uid),
        'stats'   => $evaluacion['stats'],
        'logros'  => $evaluacion['logros'],
    ]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
exit;
