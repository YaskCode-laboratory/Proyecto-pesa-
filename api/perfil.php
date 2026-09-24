<?php
require_once 'cors.php';
require_once __DIR__ . '/../dao/AuthDAO.php';
require_once __DIR__ . '/../dao/UsuarioDAO.php';
require_once __DIR__ . '/../dao/BitacoraDAO.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) $action = $input['action'];

if ($action === 'obtener') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    echo json_encode(['success' => true, 'perfil' => UsuarioDAO::obtenerPorId($uid)]);
    exit;
}

if ($action === 'guardar_cuestionario') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $peso = (float)($input['peso'] ?? 0);
    $edad = (int)($input['edad'] ?? 0);
    $altura = (float)($input['altura'] ?? 0);
    $genero = trim($input['genero'] ?? '');
    $objetivo = trim($input['objetivo'] ?? '');
    $nivel = trim($input['nivel_experiencia'] ?? 'principiante');
    $dias = (int)($input['dias_semana'] ?? 3);

    if ($peso <= 0 || $edad <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Peso y edad son obligatorios']);
        exit;
    }

    UsuarioDAO::guardarCuestionario($uid, $peso, $edad, $altura, $genero, $objetivo, $nivel, $dias);
    BitacoraDAO::registrar((int)$uid, 'GUARDAR CUESTIONARIO', 'Objetivo: ' . $objetivo . ' · Nivel: ' . $nivel . ' · ' . $dias . ' días/semana');
    echo json_encode(['success' => true, 'mensaje' => 'Cuestionario guardado']);
    exit;
}

if ($action === 'toggle_progresion') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $activar = !empty($input['activar']);
    UsuarioDAO::activarProgresion($uid, $activar);
    BitacoraDAO::registrar((int)$uid, 'PROGRESIÓN POR NIVELES', $activar ? 'Activada' : 'Desactivada');
    echo json_encode(['success' => true, 'activado' => $activar]);
    exit;
}

if ($action === 'sumar_xp') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $xp = (int)($input['xp'] ?? 0);
    if ($xp <= 0) { http_response_code(400); echo json_encode(['error' => 'XP inválido']); exit; }

    $resultado = UsuarioDAO::aplicarXp($uid, $xp);
    echo json_encode(array_merge(['success' => true], $resultado));
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
exit;