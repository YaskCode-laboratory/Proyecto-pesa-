<?php
require_once 'cors.php';
require_once __DIR__ . '/../dao/AuthDAO.php';
require_once __DIR__ . '/../dao/UsuarioDAO.php';
require_once __DIR__ . '/../dao/PlantillaDAO.php';
require_once __DIR__ . '/../dao/SesionEntrenamientoDAO.php';
require_once __DIR__ . '/../dao/EjercicioDAO.php';
require_once __DIR__ . '/../dao/RecordDAO.php';
require_once __DIR__ . '/../dao/LogroDAO.php';
require_once __DIR__ . '/../dao/BitacoraDAO.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) $action = $input['action'];

if ($action === 'iniciar') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $plantillaId = (int)($input['plantilla_id'] ?? 0);
    $plantilla = PlantillaDAO::buscarAccesible($plantillaId, $uid);
    if (!$plantilla) { http_response_code(404); echo json_encode(['error' => 'Plantilla no encontrada']); exit; }

    $usuario = UsuarioDAO::nivelYProgresion($uid);
    $factorNivel = 1;
    if ($usuario && $usuario['nivel_progresion_on'] && (int)$usuario['nivel'] > 1) {
        $factorNivel = 1 + ((int)$usuario['nivel'] - 1) * 0.05;
    }

    $ejercicios = PlantillaDAO::ejerciciosDe($plantillaId);
    try {
        $sesionId = SesionEntrenamientoDAO::crear($uid, $plantillaId, (int)($usuario['nivel'] ?? 1), $ejercicios, $factorNivel);
        BitacoraDAO::registrar((int)$uid, 'INICIAR ENTRENAMIENTO', 'Plantilla: ' . $plantilla['nombre'] . ' · ' . count($ejercicios) . ' ejercicios');
        echo json_encode(['success' => true, 'sesion_id' => $sesionId, 'factor_nivel' => $factorNivel]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'obtener') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $sesionId = (int)($input['sesion_id'] ?? 0);
    $sesion = SesionEntrenamientoDAO::obtener($sesionId, $uid);
    if (!$sesion) { http_response_code(404); echo json_encode(['error' => 'Sesión no encontrada']); exit; }

    echo json_encode(['success' => true, 'sesion' => $sesion]);
    exit;
}

if ($action === 'completar_ejercicio') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $sesionEjercicioId = (int)($input['sesion_ejercicio_id'] ?? 0);
    $series = (int)($input['series_completadas'] ?? 0);
    $reps = (string)($input['reps_completadas'] ?? '');
    $peso = (float)($input['peso_usado'] ?? 0);

    if (!SesionEntrenamientoDAO::verificarAcceso($sesionEjercicioId, $uid)) {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }

    SesionEntrenamientoDAO::marcarCompletado($sesionEjercicioId, $series, $reps, $peso);

    $nombre = '';
    $nuevosRecords = [];
    $nuevosLogros = [];
    $logrosDesbloqueados = [];
    if ($peso > 0 && $series > 0) {
        $catalogoId = SesionEntrenamientoDAO::ejercicioCatalogoId($sesionEjercicioId);
        if ($catalogoId) {
            $nombre = EjercicioDAO::nombreCatalogo($catalogoId);
            if ($nombre) {
                $ejercicio = EjercicioDAO::insertar($uid, $nombre, $peso, $series, (int)$reps);
                $nuevosRecords = RecordDAO::registrarSiRecord($uid, $nombre, $peso, $series, (int)$reps, (int)$ejercicio['id']);
                $evaluacion = LogroDAO::evaluar($uid);
                $nuevosLogros = $evaluacion['nuevos'];
                $logrosDesbloqueados = array_values(array_filter(
                    $evaluacion['logros'],
                    fn($l) => in_array($l['codigo'], $nuevosLogros, true)
                ));
            }
        }
    }

    echo json_encode([
        'success' => true,
        'nuevos_records' => $nuevosRecords,
        'nuevos_logros' => $logrosDesbloqueados,
    ]);

    BitacoraDAO::registrar((int)$uid, 'COMPLETAR EJERCICIO', ($nombre ? $nombre . ' · ' : '') . $series . 'x' . ($reps ?: '?') . ' · ' . $peso . ' kg');
    if ($nuevosRecords) {
        $desc = array_map(fn($nr) => $nr['tipo'] . ' = ' . ($nr['valor'] ?? '?') . ' (' . ($nr['nombre_ejercicio'] ?? '') . ')', $nuevosRecords);
        BitacoraDAO::registrar((int)$uid, 'NUEVO RÉCORD', implode('; ', $desc));
    }
    if ($nuevosLogros) {
        BitacoraDAO::registrar((int)$uid, 'LOGRO DESBLOQUEADO', implode(', ', $nuevosLogros));
    }
    exit;
}

if ($action === 'iniciar_descanso') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $sesionEjercicioId = (int)($input['sesion_ejercicio_id'] ?? 0);
    SesionEntrenamientoDAO::iniciarDescanso($sesionEjercicioId);
    echo json_encode(['success' => true, 'mensaje' => 'Descanso iniciado']);
    exit;
}

if ($action === 'fin_descanso') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $sesionEjercicioId = (int)($input['sesion_ejercicio_id'] ?? 0);
    SesionEntrenamientoDAO::finDescanso($sesionEjercicioId);
    echo json_encode(['success' => true, 'mensaje' => 'Descanso terminado']);
    exit;
}

if ($action === 'finalizar') {
    $uid = AuthDAO::validarToken($input['token'] ?? '');
    if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Sesión no válida']); exit; }

    $sesionId = (int)($input['sesion_id'] ?? 0);
    $completados = (int)($input['ejercicios_completados'] ?? 0);

    $xp = 50 + $completados * 20;
    $resultado = UsuarioDAO::aplicarXp($uid, $xp);
    SesionEntrenamientoDAO::finalizar($sesionId, $uid, $xp, $resultado['nivel']);
    BitacoraDAO::registrar((int)$uid, 'FINALIZAR ENTRENAMIENTO', 'sesion_id ' . $sesionId . ' · XP ganado: +' . $xp . ' · Nivel actual: ' . $resultado['nivel']);

    echo json_encode(array_merge(['success' => true, 'xp_ganado' => $xp], $resultado));
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
exit;