<?php
require_once 'cors.php';
require_once __DIR__ . '/../dao/AuthDAO.php';
require_once __DIR__ . '/../dao/BitacoraDAO.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) $action = $input['action'];

if ($action === 'listar') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $limite = min(500, max(10, (int)($input['limite'] ?? 200)));
    echo json_encode(['success' => true, 'entradas' => BitacoraDAO::listar($limite, (int)$uid)]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
exit;