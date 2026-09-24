<?php
require_once 'cors.php';
require 'config.php';

// Manejar peticiones OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Conexión exitosa a PostgreSQL']);
?>