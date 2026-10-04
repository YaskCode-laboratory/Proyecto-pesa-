<# ==========================================================================
   PESAS PRO - Pruebas e2e reproducibles (31 pruebas)
   --------------------------------------------------------------------------
   Requisitos para ejecutar:
     1) PostgreSQL corriendo en localhost:5432 (base 'pesas' con los seeds).
     2) Servidor PHP activo:  php -S 127.0.0.1:8000 -t .   (API en /api)
     3) Microservicio IA:     cd python; python app.py      (:5001)
   Ejecutar (PowerShell):
     powershell -ExecutionPolicy Bypass -File tests\pruebas_e2e.ps1
   Salida esperada: "RESULTADO FINAL: 31/31 PASS"
   Los datos de prueba usan el dominio ficticio example.com (no se crean
   usuarios con datos reales). El registro de la bitacora local
   (actividad.log) NO se sube al repositorio.
   ========================================================================== #>

param(
    [string]$ApiBase = 'http://127.0.0.1:8000/api',
    [string]$IaBase  = 'http://127.0.0.1:5001'
)

$ProgressPreference = 'SilentlyContinue'
$script:ok = 0
$script:fail = 0
$script:fallidosLista = @()

function Invoke-Api {
    param(
        [string]$Url,
        [hashtable]$Body = @{},
        [ValidateSet('GET','POST')][string]$Metodo = 'POST'
    )
    try {
        $json = '{}'
        if (@($Body.Keys).Count -gt 0) { $json = $Body | ConvertTo-Json -Depth 8 }
        if ($Metodo -eq 'GET') {
            $resp = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -ErrorAction Stop
        } else {
            $resp = Invoke-WebRequest -Uri $Url -Method Post -ContentType 'application/json; charset=utf-8' -Body $json -UseBasicParsing -ErrorAction Stop
        }
        $obj = $null
        try { $obj = $resp.Content | ConvertFrom-Json } catch { $obj = $resp.Content }
        return @{ Status = [int]$resp.StatusCode; Json = $obj }
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        return @{ Status = $code; Json = $null }
    }
}

function Afirmar {
    param([string]$Nombre, [bool]$Condicion, [string]$Detalle = '')
    if ($Condicion) {
        $script:ok++
        Write-Host ("  OK    {0}  {1}" -f $Nombre, $Detalle) -ForegroundColor Green
    } else {
        $script:fail++
        $script:fallidosLista += $Nombre
        Write-Host ("  FALLO {0}  {1}" -f $Nombre, $Detalle) -ForegroundColor Red
    }
}

# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================="
Write-Host "  PESAS PRO - Pruebas e2e (31)  -  API: $ApiBase"
Write-Host "============================================================="
Write-Host ""

$marca = Get-Date -Format 'yyyyMMddHHmmssfff'
$clave = "ClaveE2E_$marca"
$emailA = "e2e_a_$marca@example.com"
$emailB = "e2e_b_$marca@example.com"
$nombreA = "Usuario E2E A"
$nombreB = "Usuario E2E B"

# --- AUTENTICACION (6) -----------------------------------------------------
Write-Host "[Autenticacion]"

$r = Invoke-Api "$ApiBase/auth.php?action=registro" @{ email = $emailA; password = $clave; nombre = $nombreA }
Afirmar '01 registro usuario A' ($r.Status -eq 200 -and $r.Json.success -eq $true)

$r = Invoke-Api "$ApiBase/auth.php?action=registro" @{ email = $emailA; password = $clave; nombre = $nombreA }
Afirmar '02 registro duplicado -> 409' ($r.Status -eq 409)

$r = Invoke-Api "$ApiBase/auth.php?action=login" @{ email = $emailA; password = $clave }
$tokenA = $null
if ($r.Json.token) { $tokenA = [string]$r.Json.token }
Afirmar '03 login correcto (token generado)' ($r.Status -eq 200 -and $r.Json.success -eq $true -and $tokenA.Length -eq 64)

$r = Invoke-Api "$ApiBase/auth.php?action=login" @{ email = $emailA; password = 'ClaveIncorrecta999' }
Afirmar '04 login con password incorrecto -> 401' ($r.Status -eq 401)

$r = Invoke-Api "$ApiBase/auth.php?action=validar" @{ token = $tokenA }
Afirmar '05 validar sesion con token vigente' ($r.Status -eq 200 -and $r.Json.success -eq $true)

$r = Invoke-Api "$ApiBase/auth.php?action=validar" @{ token = 'token_inexistente_de_prueba' }
Afirmar '06 validar sesion con token invalido -> 401' ($r.Status -eq 401)

# --- PERFIL / CUESTIONARIO (2) ----------------------------------------------
Write-Host "[Perfil y cuestionario]"

$r = Invoke-Api "$ApiBase/perfil.php?action=guardar_cuestionario" @{ token = $tokenA; peso = 80; edad = 25; altura = 175; genero = 'masculino'; objetivo = 'ganar_musculo'; nivel_experiencia = 'intermedio'; dias_semana = 3 }
Afirmar '07 guardar cuestionario inicial' ($r.Status -eq 200 -and $r.Json.success -eq $true)

$r = Invoke-Api "$ApiBase/perfil.php?action=guardar_cuestionario" @{ token = $tokenA; peso = 0; edad = 25; objetivo = 'ganar_musculo' }
Afirmar '08 cuestionario con peso invalido -> 400' ($r.Status -eq 400)

# --- CATALOGO (2) -----------------------------------------------------------
Write-Host "[Catalogo de ejercicios]"

$r = Invoke-Api "$ApiBase/plantillas.php?action=catalogo" @{ token = $tokenA }
$catalogo = @()
if ($r.Json.catalogo) { $catalogo = @($r.Json.catalogo) }
Afirmar '09 listar catalogo (104 ejercicios)' ($r.Status -eq 200 -and $catalogo.Count -gt 0 -and $catalogo[0].id -gt 0)

$r = Invoke-Api "$ApiBase/plantillas.php?action=catalogo&grupo=pecho" @{ token = $tokenA }
Afirmar '10 catalogo filtrado por grupo (pecho)' ($r.Status -eq 200 -and @($r.Json.catalogo).Count -gt 0)

# --- PLANTILLAS (7) ---------------------------------------------------------
Write-Host "[Plantillas]"

$ejercicio1 = $catalogo[0]
$ejercicio2 = $catalogo[[math]::Min(1, $catalogo.Count - 1)]
$bodyPlantilla = @{
    token           = $tokenA
    nombre          = 'Plantilla E2E A'
    descripcion     = 'Plantilla de prueba'
    tipo            = 'ganar_musculo'
    nivel           = 'intermedio'
    dias_por_semana = 3
    ejercicios      = @(
        @{ ejercicio_id = [int]$ejercicio1.id; series = 3; reps = '10'; peso = 20; descanso = 90 },
        @{ ejercicio_id = [int]$ejercicio2.id; series = 4; reps = '8';  peso = 40; descanso = 90 }
    )
}
$r = Invoke-Api "$ApiBase/plantillas.php?action=crear" $bodyPlantilla
$pidMain = 0
if ($r.Json.plantilla_id) { $pidMain = [int]$r.Json.plantilla_id }
Afirmar '11 crear plantilla manual (2 ejercicios)' ($r.Status -eq 200 -and $pidMain -gt 0)

$onceEjercicios = @()
for ($i = 0; $i -lt 11; $i++) { $onceEjercicios += @{ ejercicio_id = [int]$ejercicio1.id; series = 3; reps = '10'; peso = 20 } }
$r = Invoke-Api "$ApiBase/plantillas.php?action=crear" @{ token = $tokenA; nombre = 'Plantilla 11 ej'; ejercicios = $onceEjercicios }
Afirmar '12 crear plantilla con 11 ejercicios -> 400 (max 10)' ($r.Status -eq 400)

$r = Invoke-Api "$ApiBase/plantillas.php?action=listar" @{ token = $tokenA }
$contiene = @($r.Json.plantillas) | Where-Object { [int]$_.id -eq $pidMain }
Afirmar '13 listar plantillas propias' ($r.Status -eq 200 -and $null -ne $contiene)

$r = Invoke-Api "$ApiBase/plantillas.php?action=obtener" @{ token = $tokenA; plantilla_id = $pidMain }
Afirmar '14 ver detalle de plantilla con ejercicios' ($r.Status -eq 200 -and @($r.Json.plantilla.ejercicios).Count -gt 0)

$r = Invoke-Api "$ApiBase/plantillas.php?action=crear" @{ token = $tokenA; nombre = 'A eliminar E2E'; ejercicios = @(@{ ejercicio_id = [int]$ejercicio1.id; series = 3; reps = '10' }) }
$pidElim = 0
if ($r.Json.plantilla_id) { $pidElim = [int]$r.Json.plantilla_id }
$r = Invoke-Api "$ApiBase/plantillas.php?action=eliminar" @{ token = $tokenA; plantilla_id = $pidElim }
Afirmar '15 eliminar plantilla propia' ($pidElim -gt 0 -and $r.Status -eq 200 -and $r.Json.success -eq $true)

$r = Invoke-Api "$ApiBase/auth.php?action=registro" @{ email = $emailB; password = $clave; nombre = $nombreB }
$r = Invoke-Api "$ApiBase/auth.php?action=login" @{ email = $emailB; password = $clave }
$tokenB = $null
if ($r.Json.token) { $tokenB = [string]$r.Json.token }
Afirmar '16 registrar e iniciar sesion usuario B' ($r.Status -eq 200 -and $tokenB.Length -eq 64)

$r = Invoke-Api "$ApiBase/plantillas.php?action=obtener" @{ token = $tokenB; plantilla_id = $pidMain }
Afirmar '17 acceder a plantilla ajena -> 404' ($r.Status -eq 404)

# --- SESIONES (6) -----------------------------------------------------------
Write-Host "[Sesiones de entrenamiento]"

$r = Invoke-Api "$ApiBase/sesiones.php?action=iniciar" @{ token = $tokenA; plantilla_id = $pidMain }
$sesionId = 0
if ($r.Json.sesion_id) { $sesionId = [int]$r.Json.sesion_id }
Afirmar '18 iniciar sesion de entrenamiento' ($r.Status -eq 200 -and $sesionId -gt 0 -and $r.Json.success -eq $true)

$r = Invoke-Api "$ApiBase/sesiones.php?action=obtener" @{ token = $tokenA; sesion_id = $sesionId }
$seId = 0
if ($r.Json.sesion.ejercicios) { $seId = [int]$r.Json.sesion.ejercicios[0].id }
Afirmar '19 obtener sesion con ejercicios' ($r.Status -eq 200 -and $seId -gt 0)

$r = Invoke-Api "$ApiBase/sesiones.php?action=completar_ejercicio" @{ token = $tokenA; sesion_ejercicio_id = $seId; series_completadas = 4; reps_completadas = '8'; peso_usado = 50 }
Afirmar '20 completar ejercicio de la sesion' ($r.Status -eq 200 -and $r.Json.success -eq $true)

$d1 = Invoke-Api "$ApiBase/sesiones.php?action=iniciar_descanso" @{ token = $tokenA; sesion_ejercicio_id = $seId }
$d2 = Invoke-Api "$ApiBase/sesiones.php?action=fin_descanso" @{ token = $tokenA; sesion_ejercicio_id = $seId }
Afirmar '21 iniciar y terminar descanso' ($d1.Status -eq 200 -and $d2.Status -eq 200 -and $d1.Json.success -eq $true -and $d2.Json.success -eq $true)

$r = Invoke-Api "$ApiBase/sesiones.php?action=finalizar" @{ token = $tokenA; sesion_id = $sesionId; ejercicios_completados = 5 }
Afirmar '22 finalizar sesion (XP >= 50)' ($r.Status -eq 200 -and $r.Json.success -eq $true -and [int]$r.Json.xp_ganado -ge 50)

$r = Invoke-Api "$ApiBase/sesiones.php?action=obtener" @{ token = $tokenB; sesion_id = $sesionId }
Afirmar '23 acceder a sesion ajena -> 404' ($r.Status -eq 404)

# --- HISTORIAL / RECORDS / LOGROS (4) ---------------------------------------
Write-Host "[Historial, records y logros]"

$r = Invoke-Api "$ApiBase/agregar_ejercicio.php?action=agregar_ejercicio" @{ token = $tokenA; exerciseName = 'Press banca E2E'; weight = 60; series = 4; reps = 6 }
Afirmar '24 registrar ejercicio manual (volumen > 0)' ($r.Status -eq 200 -and $r.Json.success -eq $true -and [long]$r.Json.volumenTotal -gt 0)

$r = Invoke-Api "$ApiBase/agregar_ejercicio.php?action=listar" @{ token = $tokenA }
Afirmar '25 listar historial reciente' ($r.Status -eq 200 -and [int]$r.Json.totalEjercicios -ge 1)

$r = Invoke-Api "$ApiBase/records.php?action=listar" @{ token = $tokenA }
$tieneLogros = @($r.Json.PSObject.Properties.Name) -contains 'logros'
Afirmar '26 listar records, racha y logros' ($r.Status -eq 200 -and $tieneLogros)

$r = Invoke-Api "$ApiBase/bitacora.php?action=listar" @{ token = $tokenA }
Afirmar '27 listar bitacora (entradas >= 1)' ($r.Status -eq 200 -and @($r.Json.entradas).Count -ge 1)

# --- LOGOUT (2) -------------------------------------------------------------
Write-Host "[Logout]"

$r = Invoke-Api "$ApiBase/auth.php?action=logout" @{ token = $tokenA }
Afirmar '28 logout (sesion eliminada)' ($r.Status -eq 200 -and $r.Json.success -eq $true)

$r = Invoke-Api "$ApiBase/auth.php?action=validar" @{ token = $tokenA }
Afirmar '29 token ya no valido despues del logout -> 401' ($r.Status -eq 401)

# --- MICROSERVICIO IA (2) ---------------------------------------------------
Write-Host "[Microservicio IA (:5001)]"

$r = Invoke-Api "$IaBase/analisis/progreso?token=$tokenB" @{} 'GET'
Afirmar '30 IA tendencia de progreso' ($r.Status -eq 200 -and $r.Json.success -eq $true)

$r = Invoke-Api "$IaBase/plantilla_ia" @{ token = $tokenB; objetivo = 'ganar_musculo'; nivel = 'intermedio'; dias_semana = 3; peso = 75 }
Afirmar '31 IA generacion de rutina (plantilla_ia)' ($r.Status -eq 200 -and $r.Json.success -eq $true -and @($r.Json.ejercicios).Count -gt 0)

# --- RESUMEN ----------------------------------------------------------------
Write-Host ""
Write-Host "============================================================="
Write-Host ("RESULTADO FINAL: {0}/31 PASS  |  FAIL: {1}" -f $script:ok, $script:fail)
if ($script:fail -gt 0) {
    Write-Host ("Pruebas fallidas: {0}" -f ($script:fallidosLista -join ', ')) -ForegroundColor Red
}
Write-Host "============================================================="
Write-Host "  Nota: los usuarios de prueba se registran en la BD (dominio"
Write-Host "  example.com). Puede borrarlos con psql si se desea mantener"
Write-Host "  la base limpia (u ON DELETE en la tabla usuarios)."
Write-Host ""
if ($script:fail -gt 0) { exit 1 } else { exit 0 }