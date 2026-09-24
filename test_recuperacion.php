<?php
echo "=== Test 1: Solicitar recuperación ===\n";
$ctx = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode(['action' => 'recover_request', 'email' => 'test@test.com'])
    ]
]);
$r = file_get_contents('http://127.0.0.1:8000/api/auth.php', false, $ctx);
$data = json_decode($r, true);
echo $r . "\n\n";
$token = $data['token'] ?? '';

echo "=== Test 2: Reset contraseña ===\n";
$ctx = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode([
            'action' => 'recover_reset',
            'token' => $token,
            'new_password' => 'nueva123',
            'confirm_password' => 'nueva123'
        ])
    ]
]);
$r = file_get_contents('http://127.0.0.1:8000/api/auth.php', false, $ctx);
echo $r . "\n\n";

echo "=== Test 3: Login con nueva contraseña ===\n";
$ctx = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode(['action' => 'login', 'email' => 'test@test.com', 'password' => 'nueva123'])
    ]
]);
$r = file_get_contents('http://127.0.0.1:8000/api/auth.php', false, $ctx);
$data = json_decode($r, true);
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "=== Test 4: Token usado (debería fallar) ===\n";
$ctx = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode([
            'action' => 'recover_reset',
            'token' => $token,
            'new_password' => 'otra123',
            'confirm_password' => 'otra123'
        ])
    ]
]);
$r = @file_get_contents('http://127.0.0.1:8000/api/auth.php', false, $ctx);
echo $r . "\n";

echo "\n=== ✅ Tests completados ===\n";
?>