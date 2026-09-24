<?php
require_once 'cors.php';
require_once __DIR__ . '/../dao/AuthDAO.php';
require_once __DIR__ . '/../dao/BitacoraDAO.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) $action = $input['action'];
if (empty($input)) $input = $_POST;

if ($action === 'registro') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $nombre = trim($input['nombre'] ?? '');

    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y contraseña son obligatorios']);
        exit;
    }

    if (AuthDAO::existeEmail($email)) {
        http_response_code(409);
        echo json_encode(['error' => 'Este email ya está registrado']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $nuevo = AuthDAO::crearUsuario($email, $hash, $nombre);
    BitacoraDAO::registrar((int)$nuevo['id'], 'REGISTRO', 'Nuevo usuario registrado: ' . $email);
    echo json_encode(['success' => true, 'usuario' => $nuevo]);
    exit;
}

if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y contraseña son obligatorios']);
        exit;
    }

    $row = AuthDAO::buscarPorEmail($email);
    if ($row && password_verify($password, $row['password'])) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        AuthDAO::crearSesion((int)$row['id'], $token, $expires);
        BitacoraDAO::registrar((int)$row['id'], 'LOGIN', 'Inicio de sesión');
        echo json_encode([
            'success' => true,
            'token' => $token,
            'userId' => (int)$row['id'],
            'nombre' => $row['nombre']
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales incorrectas']);
    }
    exit;
}

if ($action === 'validar') {
    $token = $input['token'] ?? '';
    $user = AuthDAO::usuarioPorToken($token);
    if ($user) {
        echo json_encode(['success' => true, 'id' => (int)$user['id'], 'nombre' => $user['nombre']]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Sesión no válida']);
    }
    exit;
}

if ($action === 'logout') {
    $token = $input['token'] ?? '';
    if ($token) {
        $uid = AuthDAO::validarToken($token);
        if ($uid) BitacoraDAO::registrar((int)$uid, 'LOGOUT', 'Cierre de sesión');
        AuthDAO::eliminarSesion($token);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Token requerido']);
    }
    exit;
}

if ($action === 'recover_request') {
    $email = trim($input['email'] ?? '');
    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Email requerido']);
        exit;
    }

    $userId = AuthDAO::buscarIdPorEmail($email);
    if (!$userId) {
        http_response_code(404);
        echo json_encode(['error' => 'Email no registrado']);
        exit;
    }

    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
    AuthDAO::borrarResets($userId);
    AuthDAO::crearReset($userId, $token, $expires);
    BitacoraDAO::registrar((int)$userId, 'SOLICITAR CAMBIO DE CONTRASEÑA', 'Token de recuperación generado para ' . $email);

    echo json_encode([
        'success' => true,
        'mensaje' => 'Token de recuperación generado',
        'token' => $token
    ]);
    exit;
}

if ($action === 'recover_reset') {
    $token = $input['token'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmPassword = $input['confirm_password'] ?? '';

    if (!$token || !$newPassword) {
        http_response_code(400);
        echo json_encode(['error' => 'Token y nueva contraseña son obligatorios']);
        exit;
    }

    if ($newPassword !== $confirmPassword) {
        http_response_code(400);
        echo json_encode(['error' => 'Las contraseñas no coinciden']);
        exit;
    }

    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
        exit;
    }

    $userId = AuthDAO::resetValido($token);
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit;
    }

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    AuthDAO::actualizarPassword($userId, $hash);
    AuthDAO::marcarResetUsado($token);
    BitacoraDAO::registrar((int)$userId, 'CONTRASEÑA CAMBIADA', 'Contraseña actualizada mediante token de recuperación');

    echo json_encode(['success' => true, 'mensaje' => 'Contraseña actualizada correctamente']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
exit;