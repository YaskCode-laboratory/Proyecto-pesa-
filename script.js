// Base de datos local en memoria
const baseDeDatosCuentas = [];
const historialEjerciciosAtleta = [];
let usuarioLogueado = null;

// Estados de Planificación
let diasSeleccionadosGym = [];
let minutosSugeridosSemana = 0;

// Variables de Control del Reloj
let tiempoSegundosTotales = 0;
let intervaloSensorTiempo = null;
let sensorCorriendo = false;
let modoActual = "ejercicio"; 
let tiempoOriginalEjercicio = 0;

// VARIABLES GLOBALES PARA LA RECUPERACIÓN POR GMAIL (EMAILJS)
let codigoGenerado = null;
let correoARecuperar = "";

// =========================================================================
// CONFIGURACIÓN DE EMAILJS (REEMPLAZA CON TUS DATOS REALES DE TU PANEL)
// =========================================================================
const EMAILJS_SERVICE_ID ="service_kwgvo54";    // Pon tu Service ID aquí
const EMAILJS_TEMPLATE_ID = "template_qqkl5k3";  // Pon tu Template ID aquí
const EMAILJS_PUBLIC_KEY = "tN96PmsdMk8MFlk9u";    // Pon tu Public Key aquí

// Inicializa EmailJS con tu Clave Pública
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}
// =========================================================================

// CONTROL DEL MENÚ LATERAL INTERACTIVO (OCULTAR/MOSTRAR COMPLETAMENTE)
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (menuToggle && sidebar && mainContent) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
});

// ENRUTADOR PRINCIPAL SPA
function navegarA(seccionId) {
    const paneles = document.querySelectorAll('.app-section-panel');
    paneles.forEach(panel => panel.classList.remove('active'));

    const enlaces = document.querySelectorAll('.menu-item');
    enlaces.forEach(enlace => enlace.classList.remove('active'));

    const seccionObjetivo = document.getElementById(`sec-${seccionId}`);
    const enlaceObjetivo = document.getElementById(`link-${seccionId}`);
    
    if (seccionObjetivo && enlaceObjetivo) {
        seccionObjetivo.classList.add('active');
        enlaceObjetivo.classList.add('active');
    }

    // En pantallas pequeñas, colapsar el menú al cambiar de sección
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('collapsed');
        document.getElementById('mainContent').classList.remove('expanded');
    }

    if (seccionId === 'graficas') {
        actualizarGraficasYMetricas();
    }
}

// VALIDACIÓN DE REGISTRO E INGRESO REAL
function cambiarPestaña(tipo) {
    document.getElementById('loginForm').style.display = tipo === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tipo === 'register' ? 'block' : 'none';
    document.getElementById('recoverForm').style.display = tipo === 'recover' ? 'block' : 'none';
    
    // Controlar visibilidad de las pestañas superiores (ocultar en modo recuperación)
    document.getElementById('authTabs').style.display = tipo === 'recover' ? 'none' : 'flex';
    
    if (tipo !== 'recover') {
        const tabs = document.querySelectorAll('.auth-tabs .tab-btn');
        tabs[0].classList.toggle('active', tipo === 'login');
        tabs[1].classList.toggle('active', tipo === 'register');
    } else {
        // Inicializar pasos del formulario de recuperación
        document.getElementById('recoverStep1').style.display = 'block';
        document.getElementById('recoverStep2').style.display = 'none';
        document.getElementById('recoverSubtitle').textContent = "Introduce tu correo para enviarte un código de verificación";
    }
    
    document.getElementById('errorMessage').style.display = 'none';
}

function manejarRegistro(event) {
    event.preventDefault();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const user = document.getElementById('regUser').value.trim();

    // Validar duplicados
    const existe = baseDeDatosCuentas.some(cuenta => cuenta.correo === email);
    if (existe) {
        alert("⚠️ Este correo electrónico ya se encuentra registrado.");
        return;
    }

    baseDeDatosCuentas.push({ correo: email, clave: password, usuario: user });
    alert("💪 ¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.");
    cambiarPestaña('login');
}

function manejarIngreso(event) {
    event.preventDefault();
    const emailInput = document.getElementById('loginEmail').value.trim();
    const passwordInput = document.getElementById('loginPassword').value;
    const errorBox = document.getElementById('errorMessage');
    const errorTxt = document.getElementById('errorText');

    // Buscar coincidencia exacta en el arreglo local
    const cuentaEncontrada = baseDeDatosCuentas.find(cuenta => cuenta.correo === emailInput && cuenta.clave === passwordInput);

    if (cuentaEncontrada) {
        // Permitir acceso real
        usuarioLogueado = cuentaEncontrada;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'flex';
        document.getElementById('saludoUsuario').textContent = `| @${cuentaEncontrada.usuario}`;
        errorBox.style.display = 'none';
    } else {
        // Denegar acceso si no se ha creado la cuenta primero
        errorTxt.textContent = "Error: Usuario no registrado o contraseña inválida. Regístrate primero o recupera tu contraseña.";
        errorBox.style.display = 'block';
    }
}

// ==========================================
// SECCIÓN ACTUALIZADA: RECUPERACIÓN POR GMAIL (EMAILJS)
// ==========================================

// Paso 1: Buscar usuario, generar código de 6 dígitos y enviarlo por EmailJS
function manejarRecuperacion(event) {
    event.preventDefault();
    
    correoARecuperar = document.getElementById('recoverEmail').value.trim();
    
    // Validar si el correo existe en la base de datos local en memoria
    const usuarioExiste = baseDeDatosCuentas.find(cuenta => cuenta.correo === correoARecuperar);
    
    if (!usuarioExiste) {
        alert("⚠️ El correo ingresado no pertenece a ninguna cuenta registrada.");
        return;
    }
    
    // Generar token aleatorio de 6 dígitos string
    codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Parámetros dinámicos para el Template de EmailJS (asegúrate de usarlos en tu panel de EmailJS)
    const templateParams = {
        to_email: correoARecuperar,
        codigoGenerado: codigoGenerado
    };

    // Envío del email utilizando la API global corregida de EmailJS
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function(response) {
            alert('📨 Código enviado. Revisa tu bandeja de entrada de Gmail.');
            // Transición al formulario del paso 2 (Verificar y Cambiar)
            document.getElementById('recoverStep1').style.display = 'none';
            document.getElementById('recoverStep2').style.display = 'block';
            document.getElementById('recoverSubtitle').textContent = "Introduce el código recibido y tu nueva clave";
        }, function(error) {
            alert('❌ Falló el envío del código. Verifica las credenciales de EmailJS en tu script.js');
            console.error('Error EmailJS:', error);
        });
}

// Paso 2: Verificar que el código coincida y actualizar el array local 'baseDeDatosCuentas'
function verificarCodigoYCambiar() {
    const codigoIngresado = document.getElementById('recoverCode').value.trim();
    const nuevaClave = document.getElementById('recoverNewPassword').value;
    
    if (!codigoIngresado || !nuevaClave) {
        alert('⚠️ Por favor completa el código y la nueva contraseña.');
        return;
    }

    if (codigoIngresado !== codigoGenerado) {
        alert('❌ El código de verificación introducido es inválido. Inténtalo de nuevo.');
        return;
    }
    
    // Encontrar el índice de la cuenta para mutar la contraseña
    const cuentaIndex = baseDeDatosCuentas.findIndex(cuenta => cuenta.correo === correoARecuperar);
    
    if (cuentaIndex !== -1) {
        // Cambiar contraseña
        baseDeDatosCuentas[cuentaIndex].clave = nuevaClave;
        alert('🔒 ¡Contraseña modificada con éxito! Ya puedes loguearte al panel.');
        
        // Limpiar variables de recuperación y volver al estado inicial del login
        codigoGenerado = null;
        correoARecuperar = "";
        document.getElementById('recoverEmail').value = "";
        document.getElementById('recoverCode').value = "";
        document.getElementById('recoverNewPassword').value = "";
        cambiarPestaña('login');
    } else {
        alert('❌ Error crítico: La cuenta desapareció durante el proceso.');
    }
}

// ==========================================
// LÓGICA ANTERIOR DE RECALCULOS, TABLAS Y SENSOR
// ==========================================

function validarLetrasInput(inputElement) {
    inputElement.value = inputElement.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
}

function toggleDiaSemana(boton, dia) {
    boton.classList.toggle('active');
    if (boton.classList.contains('active')) {
        if (!diasSeleccionadosGym.includes(dia)) diasSeleccionadosGym.push(dia);
    } else {
        if (diasSeleccionadosGym.includes(dia)) diasSeleccionadosGym = diasSeleccionadosGym.filter(d => d !== dia);
    }
    recalcularDistribuciónDiaria();
}

function calcularYDistribuirTiempo() {
    const peso = parseFloat(document.getElementById('weightInput').value);
    if (!peso || peso <= 0) {
        alert("⚠️ Por favor introduce un peso válido para calcular las horas.");
        return;
    }
    minutosSugeridosSemana = peso < 15 ? 120 : (peso >= 15 && peso < 50 ? 180 : 240);
    document.getElementById('distributionDisplay').style.display = 'block';
    recalcularDistribuciónDiaria();
}

function recalcularDistribuciónDiaria() {
    if (minutosSugeridosSemana === 0) return;
    const totalTxt = document.getElementById('totalSemanalTxt');
    const diarioTxt = document.getElementById('tiempoDiarioTxt');
    let hrsSemana = Math.floor(minutosSugeridosSemana / 60);
    totalTxt.textContent = `${hrsSemana} Horas (${minutosSugeridosSemana} min)`;

    if (diasSeleccionadosGym.length === 0) {
        diarioTxt.innerHTML = `<span style="color: #ffa502;">⚠️ Elige al menos 1 día arriba para repartir el tiempo.</span>`;
        return;
    }

    let minutosPorDia = Math.round(minutosSugeridosSemana / diasSeleccionadosGym.length);
    diarioTxt.textContent = `${minutosPorDia} minutos por día`;
    tiempoSegundosTotales = minutosPorDia * 60;
    tiempoOriginalEjercicio = tiempoSegundosTotales; 
    modoActual = "ejercicio";
    actualizarInterfazSensor();
}

function actualizarInterfazSensor() {
    const minutes = Math.floor(tiempoSegundosTotales / 60);
    const seconds = tiempoSegundosTotales % 60;
    document.getElementById('timerDisplay').textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    const badge = document.getElementById('timerStatusMode');
    const btnDescanso = document.getElementById('btnDescanso');

    if (modoActual === "ejercicio") {
        badge.textContent = "MODO: EJERCICIO 🏋️‍♂️";
        badge.className = "mode-badge ejercicio";
        if (sensorCorriendo) btnDescanso.style.display = "inline-block";
    } else {
        badge.textContent = "MODO: DESCANSO ⏱️";
        badge.className = "mode-badge descanso";
        btnDescanso.style.display = "none";
    }
}

function alternarTemporizador() {
    const btn = document.getElementById('btnStartTimer');
    if (sensorCorriendo) {
        clearInterval(intervaloSensorTiempo);
        sensorCorriendo = false;
        btn.innerHTML = `<i class="fa-solid fa-play"></i> Continuar`;
        btn.style.background = "#ffa502";
    } else {
        if (tiempoSegundosTotales <= 0) {
            alert("⚠️ Elige tus días y calcula por peso primero.");
            return;
        }
        sensorCorriendo = true;
        btn.innerHTML = `<i class="fa-solid fa-pause"></i> Pausar`;
        btn.style.background = "#2ed573";
        if (modoActual === "ejercicio") document.getElementById('btnDescanso').style.display = "inline-block";

        intervaloSensorTiempo = setInterval(() => {
            tiempoSegundosTotales--;
            actualizarInterfazSensor();
            if (tiempoSegundosTotales <= 0) {
                clearInterval(intervaloSensorTiempo);
                sensorCorriendo = false;
                if (modoActual === "ejercicio") {
                    alert("⏰ ¡Bloque diario completado! Pasa al descanso.");
                    activarModoDescanso();
                } else {
                    alert("💪 ¡Descanso finalizado! Retoma la sesión.");
                    volverAlEjercicio();
                }
            }
        }, 1000);
    }
}

function activarModoDescanso() {
    clearInterval(intervaloSensorTiempo);
    sensorCorriendo = false;
    if (modoActual === "ejercicio" && tiempoSegundosTotales > 0) tiempoOriginalEjercicio = tiempoSegundosTotales;
    modoActual = "descanso";
    tiempoSegundosTotales = 120; 
    document.getElementById('btnStartTimer').innerHTML = `<i class="fa-solid fa-play"></i> Iniciar Descanso`;
    document.getElementById('btnStartTimer').style.background = "#ffa502";
    document.getElementById('btnDescanso').style.display = "none";
    actualizarInterfazSensor();
}

function volverAlEjercicio() {
    clearInterval(intervaloSensorTiempo);
    sensorCorriendo = false;
    modoActual = "ejercicio";
    tiempoSegundosTotales = tiempoOriginalEjercicio;
    document.getElementById('btnStartTimer').innerHTML = `<i class="fa-solid fa-play"></i> Continuar Ejercicio`;
    document.getElementById('btnStartTimer').style.background = "#ff4757";
    actualizarInterfazSensor();
}

function reiniciarTemporizador() {
    clearInterval(intervaloSensorTiempo);
    sensorCorriendo = false;
    modoActual = "ejercicio";
    tiempoSegundosTotales = 0;
    tiempoOriginalEjercicio = 0;
    document.getElementById('timerDisplay').textContent = "00:00";
    document.getElementById('btnDescanso').style.display = "none";
    document.getElementById('btnStartTimer').innerHTML = `<i class="fa-solid fa-play"></i> Iniciar`;
    document.getElementById('btnStartTimer').style.background = "#ff4757";
    actualizarInterfazSensor();
}

function agregarEjercicioTabla(event) {
    event.preventDefault();
    const nombre = document.getElementById('exerciseName').value.trim();
    const peso = parseFloat(document.getElementById('weightInput').value);
    const series = parseInt(document.getElementById('seriesInput').value);
    const reps = parseInt(document.getElementById('repsInput').value);

    const volumenTotal = peso * series * reps;
    historialEjerciciosAtleta.push({ nombre, peso, series, reps, volumenTotal });

    const tbody = document.getElementById('routineTableBody');
    if (historialEjerciciosAtleta.length === 1) tbody.innerHTML = "";

    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td><strong>${nombre}</strong></td>
        <td>${peso} kg</td>
        <td>${series}</td>
        <td>${reps}</td>
        <td><span class="volume-tag" style="background:#ff4757; padding:2px 8px; border-radius:4px; font-weight:bold;">${volumenTotal} kg</span></td>
        <td><button type="button" class="btn-delete-row" style="background:none; border:none; color:#ff4757; cursor:pointer;" onclick="removerEjercicio(this, ${volumenTotal})"><i class="fa-solid fa-trash-can"></i></button></td>
    `;
    tbody.appendChild(fila);

    document.getElementById('exerciseName').value = "";
    document.getElementById('weightInput').value = "";
    document.getElementById('seriesInput').value = "";
    document.getElementById('repsInput').value = "";
}

function removerEjercicio(boton, vol) {
    const index = historialEjerciciosAtleta.findIndex(e => e.volumenTotal === vol);
    if (index !== -1) historialEjerciciosAtleta.splice(index, 1);
    boton.closest('tr').remove();
    if (historialEjerciciosAtleta.length === 0) {
        document.getElementById('routineTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center; color:#aaa;">No hay cargas registradas hoy.</td></tr>`;
    }
}

// ACTUALIZACIÓN DE ANALÍTICAS Y RENDIMIENTO
function actualizarGraficasYMetricas() {
    let volTotal = 0;
    let cargaMaxima = 0;
    let cuentaFuerza = 0;
    let cuentaHipertrofia = 0;
    let cuentaResistencia = 0;

    historialEjerciciosAtleta.forEach(ex => {
        volTotal += ex.volumenTotal;
        if (ex.peso > cargaMaxima) cargaMaxima = ex.peso;
        if (ex.peso >= 50) cuentaFuerza++;
        else if (ex.peso >= 15 && ex.peso < 50) cuentaHipertrofia++;
        else cuentaResistencia++;
    });

    document.getElementById('metricVolumenTotal').textContent = `${volTotal} kg`;
    document.getElementById('metricTotalEjercicios').textContent = historialEjerciciosAtleta.length;
    document.getElementById('metricCargaMax').textContent = `${cargaMaxima} kg`;

    const totalClasificaciones = historialEjerciciosAtleta.length || 1;
    document.getElementById('barFuerza').style.width = `${(cuentaFuerza / totalClasificaciones) * 100}%`;
    document.getElementById('barHipertrofia').style.width = `${(cuentaHipertrofia / totalClasificaciones) * 100}%`;
    document.getElementById('barResistencia').style.width = `${(cuentaResistencia / totalClasificaciones) * 100}%`;
}

function toggleCyberTheme() {
    document.body.classList.toggle('cyberpunk-mode');
    alert("🤖 Filtro Cyberpunk alternado.");
}

function limpiarTodoElHistorial() {
    if (confirm("⚠️ ¿Deseas purgar las bitácoras?")) {
        historialEjerciciosAtleta.length = 0;
        document.getElementById('routineTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center; color:#aaa;">No hay cargas registradas hoy.</td></tr>`;
        reiniciarTemporizador();
    }
}