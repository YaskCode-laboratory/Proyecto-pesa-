/* --------------------------------------------------------------
   CONFIGURACIÓN DE LA API
-------------------------------------------------------------- */
const API_BASE = 'http://localhost:8000/api/';

/* --------------------------------------------------------------
   VARIABLES DE ESTADO (gráficas, sesión, plantillas)
-------------------------------------------------------------- */
let progresoChart = null;
let historialEjerciciosAtleta = [];
let usuarioLogueado = null;

/* --------------------------------------------------------------
   ALMACENAMIENTO A PRUEBA DE BLOQUEOS DEL NAVEGADOR
   (Edge con "Prevención de seguimiento: Estricto" bloquea localStorage
   para 127.0.0.1 -- esto lanza SecurityError en CADA getItem/setItem).
   Aquí degradamos con elegancia: localStorage -> sessionStorage ->
   window.name (persiste entre recargas de la pestaña y NO es storage
   bloqueable) -> memoria, de modo que el login/sesión NUNCA dependa
   de que el navegador permita storage.
-------------------------------------------------------------- */
const almacenMemoria = {};
function stgGet(clave) {
    if (Object.prototype.hasOwnProperty.call(almacenMemoria, clave)) return almacenMemoria[clave];
    try { const v = localStorage.getItem(clave); if (v !== null) return v; } catch (e) { /* bloqueado */ }
    try { const v = sessionStorage.getItem(clave); if (v !== null) return v; } catch (e) { /* bloqueado */ }
    try { if (window.name) { const o = JSON.parse(window.name); if (clave in o) return o[clave]; } } catch (e) { /* corrupto */ }
    return null;
}
function stgSet(clave, valor) {
    almacenMemoria[clave] = valor;
    try { localStorage.setItem(clave, valor); } catch (e) { /* bloqueado */ }
    try { sessionStorage.setItem(clave, valor); } catch (e) { /* bloqueado */ }
    try { const o = window.name ? JSON.parse(window.name) : {}; o[clave] = valor; window.name = JSON.stringify(o); } catch (e) { /* corrupto */ }
}
function stgDel(clave) {
    delete almacenMemoria[clave];
    try { localStorage.removeItem(clave); } catch (e) { /* bloqueado */ }
    try { sessionStorage.removeItem(clave); } catch (e) { /* bloqueado */ }
    try { if (window.name) { const o = JSON.parse(window.name); delete o[clave]; window.name = JSON.stringify(o); } } catch (e) { /* corrupto */ }
}

/* --------------------------------------------------------------
   INICIALIZACIÓN DE LA INTERFAZ
-------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    /* ---- Menú lateral (mostrar/ocultar) ---- */
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (menuToggle && sidebar && mainContent) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }

    /* ---- Gráfica de progreso ---- */
    initProgresoChart();

    /* ---- Validar sesión al cargar la página ---- */
    await validarSesion();
});

/* --------------------------------------------------------------
   VALIDAR SESIÓN
-------------------------------------------------------------- */
function conservarTokenSiLoginReciente() {
    /* El login escribió la marca en localStorage. Si el fetch de validar
       (que corre en paralelo al arranque y puede responder 401 con un token
       viejo) termina justo después de un login OK, NO borrar el token nuevo. */
    const tG = parseInt(stgGet('tokenGuardadoEn') || '0', 10);
    const ahora = Date.now();
    return tG > 0 && (ahora - tG) < 15000;
}

function huboLoginReciente() {
    return conservarTokenSiLoginReciente();
}

async function validarSesion() {
    const token = stgGet('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'validar', token })
        });
        const data = await response.json();

        if (data.success) {
            usuarioLogueado = { nombre: data.nombre, id: data.id };
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'flex';
            document.getElementById('saludoUsuario').textContent = `| @${data.nombre}`;
            cargarHistorial();
            verificarCuestionario();
        } else {
            /* Evita la carrera "me saca al instante al inicio". Doble defensa:
               1) Sin cuenta con login reciente (<60 s), y
               2) el token guardado AHORA es el MISMO que se está validando
                  (si lo reemplazó un login, nunca borrarlo).
               SOLO si ambas se cumplen el token es el viejo-inválido y se limpia. */
            const tokenActual = stgGet('token');
            if (!huboLoginReciente() && tokenActual === token) {
                stgDel('token');
            }
        }
    } catch (e) {
        console.error('Error al validar sesión', e);
    }
}

/* --------------------------------------------------------------
   CAMBIAR DE PÁGINA/DE PESTAÑA (UI)
-------------------------------------------------------------- */
function cambiarPestaña(tipo) {
    document.getElementById('loginForm').style.display = tipo === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tipo === 'register' ? 'block' : 'none';
    document.getElementById('recoverForm').style.display = tipo === 'recover' ? 'block' : 'none';
    document.getElementById('authTabs').style.display = tipo === 'recover' ? 'none' : 'flex';

    if (tipo !== 'recover') {
        const tabs = document.querySelectorAll('.auth-tabs .tab-btn');
        tabs[0].classList.toggle('active', tipo === 'login');
        tabs[1].classList.toggle('active', tipo === 'register');
    } else {
        document.getElementById('recoverStep1').style.display = 'block';
        document.getElementById('recoverStep2').style.display = 'none';
        document.getElementById('recoverSubtitle').textContent =
            "Introduce tu correo para enviarte un código de verificación";
    }

    document.getElementById('errorMessage').style.display = 'none';
}

/* --------------------------------------------------------------
   MANEJO DE REGISTRO (llama al endpoint de registro)
-------------------------------------------------------------- */
async function manejarRegistro(event) {
    event.preventDefault();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const user = document.getElementById('regUser').value.trim();

    try {
        const response = await fetch(`${API_BASE}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'registro',
                email,
                password,
                nombre: user
            })
        });
        const data = await response.json();

        if (data.success) {
            alert('💪 ¡Registro exitoso! Ya puedes iniciar sesión.');
            cambiarPestaña('login');
        } else {
            alert(data.error || 'Error al registrar');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

/* --------------------------------------------------------------
   MANEJO DE INGRESO (llama al endpoint de login)
-------------------------------------------------------------- */
async function manejarIngreso(event) {
    event.preventDefault();
    const emailInput = document.getElementById('loginEmail').value.trim();
    const passwordInput = document.getElementById('loginPassword').value;
    const errorBox = document.getElementById('errorMessage');
    const errorTxt = document.getElementById('errorText');

    try {
        const response = await fetch(`${API_BASE}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: emailInput,
                password: passwordInput
            })
        });
        const data = await response.json();

        if (data.success) {
            // Guardamos el token y actualizamos la UI
            stgSet('token', data.token);
            // Marca del login reciente: evita que una validación en curso (del arranque, con token viejo)
            // borre el token recién guardado y "eche al usuario al inicio"
            stgSet('tokenGuardadoEn', String(Date.now()));
            usuarioLogueado = { nombre: data.nombre };
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'flex';
            document.getElementById('saludoUsuario').textContent = `| @${data.nombre}`;
            errorBox.style.display = 'none';
            cargarHistorial();
            verificarCuestionario();
        } else {
            errorTxt.textContent = data.error || 'Credenciales inválidas';
            errorBox.style.display = 'block';
        }
    } catch (e) {
        console.error(e);
        errorTxt.textContent = 'Error de conexión';
        errorBox.style.display = 'block';
    }
}

/* --------------------------------------------------------------
   CERRAR SESIÓN / CAMBIAR DE CUENTA
-------------------------------------------------------------- */
async function cerrarSesion(event) {
    if (event) event.preventDefault();
    if (!confirm('¿Cerrar la sesión actual?')) return;

    const token = stgGet('token');
    try {
        await fetch(`${API_BASE}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout', token })
        });
    } catch (e) { /* la API puede estar caída; aun así se sale localmente */ }

    stgDel('token');
    stgDel('tokenGuardadoEn');
    usuarioLogueado = null;

    // Volver al inicio de la app para la próxima sesión
    navegarA('rutinas');
    if (document.getElementById('loginScreen')) document.getElementById('loginScreen').style.display = 'flex';
    if (document.getElementById('appScreen')) document.getElementById('appScreen').style.display = 'none';
    if (document.getElementById('errorMessage')) document.getElementById('errorMessage').style.display = 'none';
}

/* --------------------------------------------------------------
   RECUPERAR CONTRASEÑA (API REST)
-------------------------------------------------------------- */
async function manejarRecuperacion(event) {
    event.preventDefault();
    const email = document.getElementById('recoverEmail').value.trim();
    if (!email) return alert('Correo electrónico requerido');

    try {
        const response = await fetch(`${API_BASE}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'recover_request', email })
        });
        const data = await response.json();
        if (data.success) {
            alert('✅ Código de recuperación enviado al email: ' + data.token);
            document.getElementById('recoverStep1').style.display = 'none';
            document.getElementById('recoverStep2').style.display = 'block';
        } else {
            alert(data.error || 'Error al solicitar recuperación');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

async function verificarCodigoYCambiar() {
    const token = document.getElementById('recoverCode').value.trim();
    const newPassword = document.getElementById('recoverNewPassword').value;
    const confirmPassword = document.getElementById('recoverConfirmPassword').value;

    if (!token || !newPassword || !confirmPassword) return alert('Todos los campos son obligatorios');
    if (newPassword !== confirmPassword) return alert('Las contraseñas no coinciden');
    if (newPassword.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');

    try {
        const response = await fetch(`${API_BASE}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'recover_reset', token, new_password: newPassword, confirm_password: confirmPassword })
        });
        const data = await response.json();
        if (data.success) {
            alert('✅ Contraseña actualizada correctamente');
            cambiarPestaña('login');
        } else {
            alert(data.error || 'Error al actualizar contraseña');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

/* --------------------------------------------------------------
   CARGAR HISTORIAL DESDE BACKEND
-------------------------------------------------------------- */
async function cargarHistorial() {
    const token = stgGet('token');
    if (!token) return;
    try {
        const r = await fetch(`${API_BASE}agregar_ejercicio.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'listar', token })
        });
        const data = await r.json();
        if (data.success) {
            historialEjerciciosAtleta = data.ejercicios.map(e => ({
                nombre: e.nombre,
                peso: parseFloat(e.peso),
                series: parseInt(e.series, 10),
                reps: parseInt(e.reps, 10),
                volumenTotal: parseFloat(e.peso) * parseInt(e.series, 10) * parseInt(e.reps, 10),
                id: e.id
            }));
            actualizarGraficasYMetricas();
        }
    } catch (e) {
        console.error('Error al cargar historial', e);
    }
}

/* --------------------------------------------------------------
   INICIALIZAR GRÁFICA DE PROGRESO
-------------------------------------------------------------- */
function initProgresoChart() {
    const ctx = document.getElementById('progresoChart');
    if (!ctx) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const primaryRgb = rootStyles.getPropertyValue('--color-primary-rgb').trim();
    const borderColor = rootStyles.getPropertyValue('--color-border').trim();
    const textMuted = rootStyles.getPropertyValue('--color-text-muted').trim();

    progresoChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Volumen (kg)',
                data: [],
                backgroundColor: `rgba(${primaryRgb}, 0.8)`,
                borderColor: borderColor,
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Progreso de Volumen por Ejercicio',
                    color: textMuted,
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textMuted, font: { size: 11 } },
                    grid: { color: borderColor, drawBorder: false }
                },
                x: {
                    ticks: { color: textMuted, font: { size: 11 } },
                    grid: { display: false }
                }
            },
            layout: { padding: 10 }
        }
    });
}

/* --------------------------------------------------------------
   ACTUALIZAR GRÁFICAS Y MÉTRICAS
-------------------------------------------------------------- */
function actualizarGraficasYMetricas() {
    let volTotal = 0;
    let cargaMax = 0;
    let cuentaFuerza = 0;
    let cuentaHipertrofia = 0;
    let cuentaResistencia = 0;

    historialEjerciciosAtleta.forEach(e => {
        volTotal += e.volumenTotal;
        if (e.peso > cargaMax) cargaMax = e.peso;
        if (e.peso >= 50) cuentaFuerza++;
        else if (e.peso >= 15 && e.peso < 50) cuentaHipertrofia++;
        else cuentaResistencia++;
    });

    document.getElementById('metricVolumenTotal').textContent = `${volTotal} kg`;
    document.getElementById('metricTotalEjercicios').textContent = historialEjerciciosAtleta.length;
    document.getElementById('metricCargaMax').textContent = `${cargaMax} kg`;
    document.getElementById('metricVolumenTotal2').textContent = `${volTotal} kg`;
    document.getElementById('metricTotalEjercicios2').textContent = historialEjerciciosAtleta.length;
    document.getElementById('metricCargaMax2').textContent = `${cargaMax} kg`;

    // Barras de distribución de intensidad
    const totalDist = cuentaFuerza + cuentaHipertrofia + cuentaResistencia;
    if (totalDist > 0) {
        const barF = document.getElementById('barFuerza');
        const barH = document.getElementById('barHipertrofia');
        const barR = document.getElementById('barResistencia');
        if (barF) barF.style.width = `${(cuentaFuerza / totalDist) * 100}%`;
        if (barH) barH.style.width = `${(cuentaHipertrofia / totalDist) * 100}%`;
        if (barR) barR.style.width = `${(cuentaResistencia / totalDist) * 100}%`;
    }

    if (progresoChart) {
        progresoChart.data.labels = historialEjerciciosAtleta.map(e => e.nombre);
        progresoChart.data.datasets[0].data = historialEjerciciosAtleta.map(e => e.volumenTotal);
        progresoChart.update();
    }
}

/* --------------------------------------------------------------
   NAVEGACIÓN DE SECCIONES
-------------------------------------------------------------- */
function navegarA(seccion) {
    document.querySelectorAll('.app-section-panel').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    const sec = document.getElementById('sec-' + seccion);
    if (sec) sec.classList.add('active');
    const link = document.getElementById('link-' + seccion);
    if (link) link.classList.add('active');
    if (seccion === 'graficas') setTimeout(actualizarGraficasYMetricas, 100);
    if (seccion === 'rutinas') { cargarPlantillas(); cargarRecomendacionesIA(); }
    if (seccion === 'recomendados') cargarCatalogo();
    if (seccion === 'records') cargarRecords();
    if (seccion === 'actividad') cargarActividad();
}

/* --------------------------------------------------------------
   OPCIONES / UTILIDADES
-------------------------------------------------------------- */
function toggleCyberTheme() {
    document.body.classList.toggle('cyberpunk-mode');
}

async function limpiarTodoElHistorial() {
    if (!confirm('¿Borrar todo el historial? Esta acción no se puede deshacer.')) return;
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}agregar_ejercicio.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'eliminar_todo', token })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'No se pudo borrar el historial');
        historialEjerciciosAtleta = [];
        actualizarGraficasYMetricas();
        alert('Historial y récords borrados');
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

/* ==========================================================================
   SISTEMA DE PLANTILLAS, CATÁLOGO, CUESTIONARIO, NIVELES Y DESCANSO (NUEVO)
   ========================================================================== */
const DESCANSO_LIMITE = 1800; // 30 minutos en segundos (auto-avance)
const SESION_LIMITE_SEGUNDOS = 600; // 10 minutos para toda la sesión de ejercicio
let plantillaCatalogo = [];
let plantillaDetalleActual = null;
let sesionActual = null;
let ejerciciosSeleccionadosCrear = [];
let descansoIntervalo = null;
let sesionIntervalo = null;
let segundosSesion = 0;
let segundosDescanso = 0;
let nivelUsuario = 1;
let xpUsuario = 0;
let xpSiguienteUsuario = 200;
let progresionActiva = false;
let recomendadaTipo = '';

function escapeHtml(texto) {
    return String(texto ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderPasosHtml(pasos) {
    if (!pasos) return '';
    const lista = String(pasos).split('\n').map(s => s.trim()).filter(Boolean)
        .map(p => `<li>${escapeHtml(p)}</li>`).join('');
    return `
    <details class="pasos-detalle">
        <summary><i class="fa-solid fa-list-check"></i> Cómo hacerlo</summary>
        <ol class="pasos-lista">${lista}</ol>
    </details>`;
}

function tipoPlantillaBadge(tipo) {
    const mapa = {
        fuerza: 'Fuerza',
        hipertrofia: 'Hipertrofia',
        gym_full: 'Full Body',
        perdida_grasa: 'Pérdida de grasa',
        definicion: 'Definición'
    };
    return mapa[tipo] || tipo;
}

/* ---------------- CUESTIONARIO INICIAL ---------------- */
async function verificarCuestionario() {
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}perfil.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'obtener', token })
        });
        const data = await r.json();
        if (!data.success || !data.perfil) return;
        const p = data.perfil;
        nivelUsuario = p.nivel || 1;
        xpUsuario = p.xp || 0;
        progresionActiva = !!p.nivel_progresion_on;
        xpSiguienteUsuario = nivelUsuario * 200;
        recomendadaTipo = tipoSegunObjetivo(p.objetivo);

        document.getElementById('toggleProgresion').checked = progresionActiva;

        if (!p.cuestionario_completado) {
            document.getElementById('cuestionarioModal').style.display = 'flex';
        } else {
            cargarNivelInfo();
            cargarPlantillas();
            cargarRecomendacionesIA();
        }
    } catch (e) {
        console.error('Error al verificar cuestionario', e);
    }
}

function tipoSegunObjetivo(objetivo) {
    const mapa = {
        ganar_musculo: 'hipertrofia',
        perder_grasa: 'perdida_grasa',
        fuerza: 'fuerza',
        definicion: 'definicion',
        salud: 'gym_full'
    };
    return mapa[objetivo] || 'gym_full';
}

async function guardarCuestionario(event) {
    event.preventDefault();
    const token = stgGet('token');
    const payload = {
        action: 'guardar_cuestionario',
        token,
        edad: document.getElementById('quizEdad').value,
        peso: document.getElementById('quizPeso').value,
        altura: document.getElementById('quizAltura').value,
        genero: document.getElementById('quizGenero').value,
        objetivo: document.getElementById('quizObjetivo').value,
        nivel_experiencia: document.getElementById('quizNivel').value,
        dias_semana: document.getElementById('quizDias').value
    };
    try {
        const r = await fetch(`${API_BASE}perfil.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error al guardar');
        document.getElementById('cuestionarioModal').style.display = 'none';
        recomendadaTipo = tipoSegunObjetivo(payload.objetivo);
        cargarNivelInfo();
        cargarPlantillas();
        cargarRecomendacionesIA();
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

/* ---------------- NIVEL Y PROGRESIÓN ---------------- */
async function cargarNivelInfo() {
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}perfil.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'obtener', token })
        });
        const data = await r.json();
        if (!data.success || !data.perfil) return;
        const p = data.perfil;
        nivelUsuario = p.nivel || 1;
        xpUsuario = p.xp || 0;
        progresionActiva = !!p.nivel_progresion_on;
        xpSiguienteUsuario = nivelUsuario * 200;
        document.getElementById('sesionNivelBadge').textContent = `Nv ${nivelUsuario}`;
        document.getElementById('toggleProgresion').checked = progresionActiva;
        const pct = Math.min(100, (xpUsuario / xpSiguienteUsuario) * 100);
        const bar = document.getElementById('nivelBarHoy');
        if (bar) bar.style.width = pct + '%';
    } catch (e) {
        console.error(e);
    }
}

async function cambiarModoProgresion() {
    const activar = document.getElementById('toggleProgresion').checked;
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}perfil.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_progresion', token, activar })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error');
        progresionActiva = data.activado;
        alert(progresionActiva
            ? '✅ Progresión activada. Tus pesos subirán 5% por cada nivel.'
            : 'Progresión por niveles desactivada.');
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

function mostrarSubidaDeNivel(data) {
    if (data.subio_nivel && data.nivel > 1) {
        document.getElementById('nivelModalNum').textContent = data.nivel;
        document.getElementById('nivelModalTitulo').textContent = '¡Subiste de Nivel!';
        document.getElementById('nivelModalDesc').textContent =
            `Eres ahora nivel ${data.nivel}.` + (progresionActiva
                ? ' Tus ejercicios serán 5% más pesados.'
                : ' Activa la progresión por niveles en Opciones para aumentar tus pesos.');
        document.getElementById('nivelModal').style.display = 'flex';
    }
}

function cerrarNivelModal() {
    document.getElementById('nivelModal').style.display = 'none';
}

/* ---------------- PLANTILLAS ---------------- */
async function cargarPlantillas() {
    const token = stgGet('token');
    if (!token) return;
    try {
        const r = await fetch(`${API_BASE}plantillas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'listar', token })
        });
        const data = await r.json();
        if (data.success) renderPlantillas(data.plantillas);
    } catch (e) {
        console.error('Error al cargar plantillas', e);
    }
}

function renderPlantillas(lista) {
    const grid = document.getElementById('plantillasGrid');
    if (!grid) return;
    if (!lista.length) {
        grid.innerHTML = '<div style="color:#aaa; padding:20px; text-align:center;">Aún no hay plantillas. Crea una tú o usa la IA.</div>';
        return;
    }

    // Las recomendadas van primero
    const ordenadas = [...lista].sort((a, b) => {
        const aRec = a.tipo === recomendadaTipo ? 0 : 1;
        const bRec = b.tipo === recomendadaTipo ? 0 : 1;
        return aRec - bRec;
    });

    grid.innerHTML = ordenadas.map(p => {
        const recomendada = p.tipo === recomendadaTipo;
        return `
        <div class="plantilla-card ${recomendada ? 'recomendada' : ''}" onclick="verDetallePlantilla(${p.id})">
            ${recomendada ? '<span class="recomendada-tag">RECOMENDADA</span>' : ''}
            ${p.usuario_id ? '<span class="recomendada-tag tuya-tag">TUYA</span>' : ''}
            <span class="plantilla-tag">${tipoPlantillaBadge(p.tipo)}</span>
            <h3>${escapeHtml(p.nombre)}</h3>
            <p class="subtitle">${escapeHtml(p.descripcion || tipoPlantillaBadge(p.tipo))}</p>
            <div class="plantilla-meta">
                <span><i class="fa-solid fa-dumbbell"></i> ${p.num_ejercicios || 0} ejercicios</span>
                <span class="nivel-mini">${escapeHtml(p.nivel)} · ${p.dias_por_semana || 3} d/sem</span>
            </div>
        </div>`;
    }).join('');
}

async function verDetallePlantilla(id) {
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}plantillas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'obtener', token, plantilla_id: id })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error');

        plantillaDetalleActual = data.plantilla;
        document.getElementById('detallePlantillaNombre').textContent = data.plantilla.nombre;
        document.getElementById('detallePlantillaDesc').textContent =
            `${tipoPlantillaBadge(data.plantilla.tipo)} · ${escapeHtml(data.plantilla.nivel)} · ${data.plantilla.dias_por_semana || 3} días/semana`;

        document.getElementById('detallePlantillaEjercicios').innerHTML = data.plantilla.ejercicios.map((e, i) => `
            <div class="preview-ej-row">
                <span class="preview-orden">${i + 1}</span>
                ${e.foto_url ? `<img src="${e.foto_url}" onerror="this.style.display='none'">` : ''}
                <strong>${escapeHtml(e.nombre_ejercicio)}</strong>
                <span>${e.series}×${e.reps}</span>
                <span>${e.peso_base} kg</span>
                ${renderPasosHtml(e.pasos)}
            </div>
        `).join('');

        document.getElementById('plantillaSelector').style.display = 'none';
        document.getElementById('plantillaDetalle').style.display = 'block';
        document.getElementById('plantillaDetalle').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        console.error(e);
    }
}

function volverAPlantillas() {
    document.getElementById('plantillaDetalle').style.display = 'none';
    document.getElementById('sesionActiva').style.display = 'none';
    document.getElementById('plantillaSelector').style.display = 'block';
    document.getElementById('plantillaSelector').scrollIntoView({ behavior: 'smooth' });
}

/* ---------------- SESIÓN DE ENTRENAMIENTO ---------------- */
async function iniciarSesionEntrenamiento() {
    if (!plantillaDetalleActual) return;
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}sesiones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'iniciar', token, plantilla_id: plantillaDetalleActual.id })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error al iniciar sesión');
        document.getElementById('plantillaDetalle').style.display = 'none';
        renderSesionActiva(data.sesion_id);
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

async function renderSesionActiva(sesionId) {
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}sesiones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'obtener', token, sesion_id: sesionId })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error al obtener sesión');

        sesionActual = data.sesion;
        document.getElementById('plantillaSelector').style.display = 'none';
        document.getElementById('plantillaDetalle').style.display = 'none';
        document.getElementById('sesionActiva').style.display = 'block';
        document.getElementById('sesionPlantillaNombre').textContent = data.sesion.plantilla_nombre;
        cargarNivelInfo();
        renderEjerciciosSesion(data.sesion.ejercicios);
        iniciarTemporizadorSesion();
        document.getElementById('sesionActiva').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        console.error(e);
    }
}

function esCompletado(e) {
    return e.completado === true || e.completado === 1 || e.completado === 't' || e.completado === '1' || e.completado === 'true';
}

function iniciarTemporizadorSesion() {
    if (sesionIntervalo) return;
    segundosSesion = SESION_LIMITE_SEGUNDOS;
    const cont = document.getElementById('sesionTimer');
    const txt = document.getElementById('sesionTimerTexto');
    if (cont) cont.style.display = 'inline-flex';
    const mostrar = () => {
        const m = Math.floor(segundosSesion / 60).toString().padStart(2, '0');
        const s = (segundosSesion % 60).toString().padStart(2, '0');
        if (txt) txt.textContent = `${m}:${s}`;
        if (segundosSesion <= 120) {
            if (txt) txt.style.color = '#ff4757';
        }
    };
    mostrar();
    sesionIntervalo = setInterval(() => {
        segundosSesion--;
        if (segundosSesion <= 0) {
            clearInterval(sesionIntervalo);
            alert('⏰ ¡Tiempo de la sesión agotado! (10 minutos). Tu progreso quedó guardado.');
            finalizarSesion();
            return;
        }
        mostrar();
    }, 1000);
}

function detenerTemporizadorSesion() {
    clearInterval(sesionIntervalo);
    sesionIntervalo = null;
    const cont = document.getElementById('sesionTimer');
    if (cont) cont.style.display = 'none';
}

function renderEjerciciosSesion(ejercicios) {
    const cont = document.getElementById('listaEjerciciosSesion');
    if (!cont) return;
    const completados = ejercicios.filter(esCompletado).length;
    document.getElementById('sesionProgresoTexto').textContent = `${completados}/${ejercicios.length} ejercicios completados`;
    document.getElementById('sesionProgressBar').style.width = `${(completados / ejercicios.length) * 100}%`;

    cont.innerHTML = ejercicios.map(e => {
        const done = esCompletado(e);
        return `
        <div class="ejercicio-sesion-row ${done ? 'done' : ''}" id="sesEj-${e.id}">
            <div class="ej-foto">
                ${e.foto_url ? `<img src="${e.foto_url}" onerror="this.style.display='none'">` : ''}
            </div>
            <div class="ej-info-sesion">
                <strong>${escapeHtml(e.nombre_ejercicio)}</strong>
                <span class="ej-grupo">${escapeHtml(e.grupo_muscular || '')}</span>
                <div class="ej-peso-edit">
                    <label>Peso (kg):</label>
                    <input type="number" id="pesoEj${e.id}" value="${e.peso_usado}" min="0" step="0.5"
                        style="width:80px; background:#1c2333; color:#fff; border:1px solid #2a3348; border-radius:6px; padding:4px 8px;" ${done ? 'disabled' : ''}>
                </div>
            </div>
            ${done
                ? '<span class="ej-done-badge"><i class="fa-solid fa-check"></i> Hecho</span>'
                : `<button class="btn-completar-ej" onclick="completarEjercicio(${e.id})"><i class="fa-solid fa-check"></i> Completar</button>`}
            ${renderPasosHtml(e.pasos)}
        </div>`;
    }).join('');
}

async function completarEjercicio(sesionEjercicioId) {
    const token = stgGet('token');
    const pesoInput = document.getElementById(`pesoEj${sesionEjercicioId}`);
    const peso = pesoInput ? parseFloat(pesoInput.value) || 0 : 0;
    try {
        const r = await fetch(`${API_BASE}sesiones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'completar_ejercicio',
                token,
                sesion_ejercicio_id: sesionEjercicioId,
                series_completadas: 3,
                reps_completadas: '10',
                peso_usado: peso
            })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error');
        mostrarAvisosRecords(data.nuevos_records, data.nuevos_logros);
        mostrarDescanso();
        if (sesionActual && sesionActual.id) renderSesionActiva(sesionActual.id);
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

function cancelarSesion() {
    if (!confirm('¿Terminar la sesión actual? Se guardará el progreso completado.')) return;
    finalizarSesion();
}

async function finalizarSesion() {
    const token = stgGet('token');
    if (!sesionActual) return;
    const ejercicios = sesionActual.ejercicios || [];
    const completados = ejercicios.filter(esCompletado).length;
    try {
        const r = await fetch(`${API_BASE}sesiones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'finalizar',
                token,
                sesion_id: sesionActual.id,
                ejercicios_completados: completados,
                total_ejercicios: ejercicios.length
            })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error al finalizar');
        sesionActual = null;
        detenerTemporizadorSesion();
        cargarNivelInfo();
        volverAPlantillas();
        cargarPlantillas();
        mostrarSubidaDeNivel(data);
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

/* ---------------- PUNTO DE DESCANSO (estilo Leap Fitness) ---------------- */
function mostrarDescanso() {
    clearInterval(descansoIntervalo);
    segundosDescanso = DESCANSO_LIMITE;
    document.getElementById('descansoTimer').textContent = '30:00';
    document.getElementById('descansoEjercicioDone').textContent = sesionActual
        ? '¡Ejercicio completado! 💪'
        : '';
    document.getElementById('descansoOverlay').style.display = 'flex';
    descansoIntervalo = setInterval(() => {
        segundosDescanso--;
        if (segundosDescanso <= 0) {
            clearInterval(descansoIntervalo);
            continuarDespuesDescanso();
            return;
        }
        const m = Math.floor(segundosDescanso / 60).toString().padStart(2, '0');
        const s = (segundosDescanso % 60).toString().padStart(2, '0');
        const el = document.getElementById('descansoTimer');
        if (el) el.textContent = `${m}:${s}`;
    }, 1000);
}

function continuarDespuesDescanso() {
    clearInterval(descansoIntervalo);
    document.getElementById('descansoOverlay').style.display = 'none';
    if (!sesionActual) return;
    const pendiente = (sesionActual.ejercicios || []).find(e => !esCompletado(e));
    if (pendiente) {
        const row = document.getElementById(`sesEj-${pendiente.id}`);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        finalizarSesion();
    }
}

/* ---------------- CATÁLOGO DE EJERCICIOS ---------------- */
async function cargarCatalogo() {
    const token = stgGet('token');
    const grupo = document.getElementById('filtroGrupo').value;
    const busqueda = document.getElementById('busquedaEjercicio').value.trim().toLowerCase();
    try {
        const r = await fetch(`${API_BASE}plantillas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'catalogo', token, grupo })
        });
        const data = await r.json();
        if (!data.success) return;
        plantillaCatalogo = data.catalogo;
        const filtrados = busqueda
            ? plantillaCatalogo.filter(e => e.nombre.toLowerCase().includes(busqueda))
            : plantillaCatalogo;
        renderCatalogo(filtrados);
    } catch (e) {
        console.error(e);
    }
}

function renderCatalogo(lista) {
    const grid = document.getElementById('catalogoGrid');
    if (!grid) return;
    if (!lista.length) {
        grid.innerHTML = '<div style="color:#aaa; padding:20px; text-align:center;">Sin resultados con los filtros actuales.</div>';
        return;
    }
    grid.innerHTML = lista.map(e => `
        <div class="catalogo-card">
            <div class="catalogo-foto" style="background-image:url('${e.foto_url}')"></div>
            <span class="grupo-badge">${escapeHtml(e.grupo_muscular)}</span>
            <h3>${escapeHtml(e.nombre)}</h3>
            <p class="subtitle">${escapeHtml(e.descripcion || '')}</p>
            <div class="catalogo-pasos">${renderPasosHtml(e.pasos)}</div>
        </div>
    `).join('');
}

/* ---------------- CREAR PLANTILLA PROPIA ---------------- */
function mostrarCreadorPlantilla() {
    document.getElementById('crearPlantillaModal').style.display = 'flex';
    document.getElementById('busquedaCrearPlantilla').value = '';
    document.getElementById('creadorListaCatalogo').innerHTML = '<div style="color:#aaa;">Cargando catálogo...</div>';
    if (plantillaCatalogo.length) {
        renderListaCreador(plantillaCatalogo);
    } else {
        cargarCatalogoParaCreador();
    }
}

async function cargarCatalogoParaCreador() {
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}plantillas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'catalogo', token })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error');
        plantillaCatalogo = data.catalogo;
        renderListaCreador(plantillaCatalogo);
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

function renderListaCreador(lista) {
    const cont = document.getElementById('creadorListaCatalogo');
    if (!cont) return;
    cont.innerHTML = lista.map(e => {
        const sel = ejerciciosSeleccionadosCrear.some(x => x.id === e.id);
        return `
        <div class="creador-ej-row ${sel ? 'sel' : ''}" onclick="toggleSeleccionCreador(${e.id}, '${escapeHtml(e.nombre).replace(/'/g, '\\\'')}')">
            <span>${escapeHtml(e.grupo_muscular)}</span>
            <strong>${escapeHtml(e.nombre)}</strong>
            ${sel
                ? '<i class="fa-solid fa-square-check" style="color:#2ed573;"></i>'
                : '<i class="fa-regular fa-square" style="color:#888;"></i>'}
        </div>`;
    }).join('');
    document.getElementById('contadorSeleccionados').textContent = ejerciciosSeleccionadosCrear.length;
}

function toggleSeleccionCreador(id, nombre) {
    const idx = ejerciciosSeleccionadosCrear.findIndex(x => x.id === id);
    if (idx !== -1) {
        ejerciciosSeleccionadosCrear.splice(idx, 1);
    } else {
        if (ejerciciosSeleccionadosCrear.length >= 10) {
            return alert('Límite alcanzado: tu plantilla propia puede tener máximo 10 ejercicios.');
        }
        ejerciciosSeleccionadosCrear.push({ id, nombre, series: 3, reps: '10', peso: 0 });
    }
    filtrarCreadorLista();
}

function filtrarCreadorLista() {
    const b = document.getElementById('busquedaCrearPlantilla').value.trim().toLowerCase();
    const lista = b ? plantillaCatalogo.filter(e => e.nombre.toLowerCase().includes(b)) : plantillaCatalogo;
    renderListaCreador(lista);
}

function filtrarCatalogoCreador(event) {
    filtrarCreadorLista();
}

async function guardarNuevaPlantilla() {
    const nombre = document.getElementById('nuevaPlantillaNombre').value.trim();
    if (!nombre) return alert('Ponle un nombre a tu plantilla');
    if (!ejerciciosSeleccionadosCrear.length) return alert('Selecciona al menos un ejercicio');
    if (ejerciciosSeleccionadosCrear.length > 10) return alert('Límite alcanzado: tu plantilla propia puede tener máximo 10 ejercicios');

    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}plantillas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'crear',
                token,
                nombre,
                tipo: document.getElementById('nuevaPlantillaTipo').value,
                dias_por_semana: document.getElementById('nuevaPlantillaDias').value,
                ejercicios: ejerciciosSeleccionadosCrear.map(e => ({
                    ejercicio_id: e.id,
                    series: e.series,
                    reps: e.reps,
                    peso: e.peso
                }))
            })
        });
        const data = await r.json();
        if (!data.success) return alert(data.error || 'Error al crear plantilla');
        alert('✅ Plantilla creada correctamente');
        ejerciciosSeleccionadosCrear = [];
        cerrarCreadorPlantilla();
        cargarPlantillas();
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

function cerrarCreadorPlantilla() {
    document.getElementById('crearPlantillaModal').style.display = 'none';
}

/* ---------------- PLANTILLA CON IA ---------------- */
async function generarPlantillaIA() {
    if (!confirm('La IA creará una plantilla personalizada según tu perfil. ¿Continuar?')) return;
    const token = stgGet('token');
    try {
        const r = await fetch(`${API_BASE}perfil.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'obtener', token })
        });
        const d = await r.json();
        if (!d.success || !d.perfil) return alert('Debes completar el cuestionario primero');

        const perfil = d.perfil;
        const aiR = await fetch('http://localhost:5001/plantilla_ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                objetivo: perfil.objetivo,
                nivel: perfil.nivel_experiencia,
                dias_semana: perfil.dias_semana,
                peso: perfil.peso,
                edad: perfil.edad
            })
        });
        const ai = await aiR.json();
        if (!ai.success) return alert(ai.error || 'Error al generar plantilla con IA');
        const motorLabel = { gemini: 'Gemini (gratis)', ollama: 'Ollama (local)', heuristica: 'heurístico' }[ai.motor_ia] || ai.motor_ia;
        alert(`✅ Plantilla generada con motor ${motorLabel}. Abriéndola para empezar...`);
        cargarPlantillas();
        verDetallePlantilla(ai.plantilla_id);
        cargarRecomendacionesIA();
    } catch (e) {
        console.error(e);
        alert('No se pudo contactar la IA. Verifica que el microservicio esté activo en el puerto 5001.');
    }
}

/* ---------------- RECOMENDACIONES DE IA ---------------- */
async function cargarRecomendacionesIA() {
    const token = stgGet('token');
    if (!token) return;
    try {
        const r = await fetch('http://localhost:5001/recomendaciones_ia' + '?token=' + encodeURIComponent(token), {
            method: 'GET'
        });
        const data = await r.json();
        if (!data.success) return;

        const panel = document.getElementById('panelRecomendaciones');
        if (!panel) return;
        panel.style.display = 'block';

        const motorLabel = { gemini: 'Gemini (gratis)', ollama: 'Ollama (local)', heuristica: 'heurístico' }[data.motor_ia] || data.motor_ia;
        document.getElementById('motorIABadge').textContent = motorLabel;
        document.getElementById('iaConsejoTexto').textContent = data.consejo_ia;

        const e = data.estructura || {};
        document.getElementById('rachaActualTxt').textContent = `${e.racha_actual} día(s)`;
        document.getElementById('mejorRachaTxt').textContent = `${e.mejor_racha} día(s)`;
        document.getElementById('plantillaSugeridaTxt').textContent = e.plantilla_recomendada || '-';
        document.getElementById('noRealizadosTxt').textContent = (e.no_realizados && e.no_realizados.length)
            ? e.no_realizados.join(', ')
            : '¡Todos los básicos cubiertos!';
        document.getElementById('estancadosTxt').textContent = (e.estancados && e.estancados.length)
            ? e.estancados.map(s => `${s.ejercicio} (${s.peso} kg)`).join(', ')
            : 'Ninguno todavía';
    } catch (err) {
        console.error('Recomendaciones IA no disponibles (¿microservicio activo?)', err);
    }
}

/* ==========================================================================
   SISTEMA DE RÉCORDS Y LOGROS
   ========================================================================== */
const RECORD_LABELS = {
    peso_maximo: 'Peso máximo',
    volumen_maximo: 'Volumen máximo',
    rm1: '1RM estimado',
    mejor_serie: 'Mejor serie'
};

async function cargarRecords() {
    const token = stgGet('token');
    if (!token) return;
    try {
        const r = await fetch(`${API_BASE}records.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'listar', token })
        });
        const data = await r.json();
        if (!data.success) return;
        renderRecords(data);
    } catch (e) {
        console.error('Error al cargar récords', e);
    }
}

function renderRecords(data) {
    const racha = data.racha || { actual: 0, mejor: 0 };
    const stats = data.stats || {};
    document.getElementById('recRachaActual').textContent = racha.actual || 0;
    document.getElementById('recMejorRacha').textContent = racha.mejor || 0;
    document.getElementById('recTotalRecords').textContent = stats.records || 0;

    const grid = document.getElementById('logrosGrid');
    if (grid) {
        const logros = data.logros || [];
        grid.innerHTML = logros.map(l => {
            const pct = l.meta > 0 ? Math.min(100, Math.round((l.progreso / l.meta) * 100)) : 0;
            const estado = l.desbloqueado
                ? '<span class="logro-estado on">✅ Desbloqueado</span>'
                : `<span class="logro-estado">${l.progreso} / ${l.meta}</span>`;
            return `<div class="logro-card ${l.desbloqueado ? 'desbloqueado' : 'bloqueado'}">
                <div class="logro-icon">${l.desbloqueado ? l.icono : '🔒'}</div>
                <h4>${escapeHtml(l.titulo)}</h4>
                <p>${escapeHtml(l.desc)}</p>
                <div class="logro-bar"><div style="width:${pct}%"></div></div>
                ${estado}
            </div>`;
        }).join('');
    }

    const tbody = document.getElementById('recordsTabla');
    if (tbody) {
        const records = data.records || [];
        tbody.innerHTML = records.length
            ? records.map(r => `<tr>
                    <td>${escapeHtml(r.ejercicio)}</td>
                    <td><strong>${r.peso_maximo}</strong> kg <small>×${r.reps_peso_maximo}</small></td>
                    <td>${r.rm1} kg</td>
                    <td>${r.mejor_serie} kg</td>
                    <td>${r.volumen_maximo} kg</td>
                </tr>`).join('')
            : '<tr><td colspan="5" style="text-align:center; color:#aaa; padding:20px;">Aún no hay récords. ¡Completa tu primer ejercicio!</td></tr>';
    }
}

function mostrarAvisosRecords(records, logros) {
    const avisos = [];
    (records || []).forEach(r => avisos.push({
        icono: '🏆',
        titulo: '¡Nuevo récord!',
        texto: `${RECORD_LABELS[r.tipo] || r.tipo}: ${r.valor} kg`
    }));
    (logros || []).forEach(l => avisos.push({
        icono: l.icono || '🎖️',
        titulo: `Logro: ${l.titulo}`,
        texto: l.desc
    }));

    const cont = document.getElementById('recordsToast');
    if (!cont || !avisos.length) return;
    avisos.forEach((a, i) => {
        const div = document.createElement('div');
        div.className = 'record-toast';
        div.innerHTML = `<span class="rt-icon">${a.icono}</span>
            <div><strong>${escapeHtml(a.titulo)}</strong><p>${escapeHtml(a.texto)}</p></div>`;
        cont.appendChild(div);
        setTimeout(() => {
            div.classList.add('saliendo');
            setTimeout(() => div.remove(), 400);
        }, 3500 + i * 600);
    });
}

/* ---------------- BITÁCORA DE ACTIVIDAD ---------------- */
async function cargarActividad() {
    const token = stgGet('token');
    const tbody = document.getElementById('bitacoraTabla');
    if (!token || !tbody) return;
    try {
        const r = await fetch(`${API_BASE}bitacora.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'listar', token, limite: 400 })
        });
        const data = await r.json();
        if (!data.success) return;
        const rows = data.entradas || [];
        tbody.innerHTML = rows.length
            ? rows.map(e => `
                <tr>
                    <td>${escapeHtml(e.fecha)}</td>
                    <td>${escapeHtml(e.email || (e.usuario_id === 'sistema' ? '(sistema)' : '·'))}</td>
                    <td><strong>${escapeHtml(e.accion)}</strong></td>
                    <td>${escapeHtml(e.detalle)}</td>
                </tr>`).join('')
            : '<tr><td colspan="4" style="text-align:center; color:#aaa; padding:20px;">Sin actividad registrada todavía. El log se guarda en actividad.log.</td></tr>';
    } catch (e) {
        console.error('Error al cargar bitácora', e);
    }
}

/* Auto-refresco en tiempo real de la bitácora (solo mientras la pestaña Actividad esté visible) */
setInterval(() => {
    const seccionActiva = document.querySelector('.app-section-panel.active');
    if (seccionActiva && seccionActiva.id === 'sec-actividad') {
        cargarActividad();
    }
}, 4000);