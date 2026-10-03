# Pruebas y Calidad — PESAS PRO

Evidencia de las pruebas ejecutadas sobre la versión final del sistema (rama `main`).

---

## 1. Alcance de las pruebas

Se ejecutaron **31 pruebas end-to-end (e2e)** contra la API real **en local** (servidor PHP `:8000` + PostgreSQL + microservicio `:5001`). Cada prueba llamó a un endpoint con un caso real (crear usuario temporal → ejecutar el flujo → verificar la respuesta JSON → limpiar los datos de prueba).

**Resultado global: 31/31 PASS** (ningún fallo).

## 2. Matriz de pruebas por funcionalidad

| # | Área | Endpoints / flujo cubierto | Resultado |
|---|---|---|---|
| 1 | Autenticación — registro | `auth.php` → `registro` | ✅ PASS |
| 2 | Autenticación — login | `auth.php` → `login` (credenciales correctas) | ✅ PASS |
| 3 | Autenticación — login inválido | `auth.php` → `login` (contraseña errónea → 401) | ✅ PASS |
| 4 | Autenticación — validar sesión | `auth.php` → `validar_sesion` con token vigente | ✅ PASS |
| 5 | Autenticación — token vencido/ausente | Endpoint protegido sin token → 401 | ✅ PASS |
| 6 | Autenticación — logout | `auth.php` → `logout` (sesión eliminada) | ✅ PASS |
| 7 | **Perfil** — cuestionario inicial | `perfil.php` → `guardar_cuestionario` (peso, edad, altura, género, objetivo, nivel, días) | ✅ PASS |
| 8 | **Perfil** — validación de rangos | Cuestionario con valores fuera de rango → 400 | ✅ PASS |
| 9 | **Catálogo** — listar ejercicios | `plantillas.php` → `catalogo` (104 ejercicios, por grupo) | ✅ PASS |
| 10 | **Catálogo** — filtro por grupo | `plantillas.php` → `catalogo` con grupo (pecho/espalda/pierna…) | ✅ PASS |
| 11 | **Plantillas** — crear a mano | `plantillas.php` → `crear` (con máx. 10 ejercicios) | ✅ PASS |
| 12 | **Plantillas** — listar propias | `plantillas.php` → `listar` | ✅ PASS |
| 13 | **Plantillas** — ver detalle | `plantillas.php` → `detalle` (con ejercicios y su ejercicio del catálogo) | ✅ PASS |
| 14 | **Plantillas** — renombrar/ajustar | `plantillas.php` → `renombrar` | ✅ PASS |
| 15 | **Plantillas** — eliminar | `plantillas.php` → `eliminar` (y bloqueo si tiene sesiones) | ✅ PASS |
| 16 | **Plantillas** — propiedad ajena | Acceso a plantilla de otro usuario → 403 | ✅ PASS |
| 17 | **Sesiones** — iniciar | `sesiones.php` → `iniciar` (crea sesión desde plantilla con ajuste por nivel) | ✅ PASS |
| 18 | **Sesiones** — completar ejercicio | `sesiones.php` → `completar_ejercicio` (series, reps, peso) | ✅ PASS |
| 19 | **Sesiones** — descanso activar/finalizar | `sesiones.php` → descanso (inicio/fin) | ✅ PASS |
| 20 | **Sesiones** — finalizar sesión | `sesiones.php` → `finalizar` (+ XP y nivel) | ✅ PASS |
| 21 | **Sesiones** — acceso a sesión ajena | `verificarAcceso` en sesión de otro usuario → 403 | ✅ PASS |
| 22 | **Historial** — registrar ejercicio | `agregar_ejercicio.php` → `registrar` | ✅ PASS |
| 23 | **Historial** — listar recientes | `agregar_ejercicio.php` → `listar` | ✅ PASS |
| 24 | **Récords** — detección de marca | `records.php` → `records` (nuevo récord detectado, 1RM Epley) | ✅ PASS |
| 25 | **Logros** — desbloqueo | `records.php` → logros (medalla nueva con su fecha) | ✅ PASS |
| 26 | **IA** — análisis de progreso | microservicio `:5001` → `/analisis/progreso` | ✅ PASS |
| 27 | **IA** — distribución de intensidad | microservicio `:5001` → `/analisis/distribucion` | ✅ PASS |
| 28 | **IA** — proyección y racha | microservicio `:5001` → `/analisis/proyeccion`, `/analisis/racha` | ✅ PASS |
| 29 | **IA** — generación de rutina | microservicio `:5001` → `POST /plantilla_ia` (cascada → heurística) | ✅ PASS |
| 30 | **Recuperación de contraseña** | `auth.php` → `recover_request` + `recover_reset` (token 1 h) + script `test_recuperacion.php` | ✅ PASS |
| 31 | **Bitácora** — listar y registrar | `bitacora.php` → `listar` y registro automático de acciones | ✅ PASS |

## 3. Prueba de recuperación de contraseña (e2e dedicada)

El archivo `test_recuperacion.php` cubre aparte el flujo completo de "olvidé mi contraseña":

1. Solicitud de recuperación → se genera un token de reseteo con expiración de 1 h.
2. Confirmación del correo de destino (flujo `recover_confirm`).
3. Cambio de contraseña con un token válido.
4. Rechazo de un token usado (`usado = TRUE`) o vencido.

**Resultado: PASS** (probado con tokens válidos, vencidos y ya usados).

## 4. Cómo ejecutar las pruebas

Requisito: servicios levantados (PHP `:8000`, PostgreSQL, y el microservicio en `:5001`).

1. Abrir una consola en la raíz del proyecto.
2. Lanzar el script e2e de pruebas (PowerShell) con el mismo esquema de las 31 pruebas anteriores.
3. La salida debe reportar `31/31 PASS`.
4. La prueba dedicada de recuperación se ejecuta con el servidor web activo:

   ```bash
   php test_recuperacion.php
   ```

> **Nota de coherencia:** las pruebas e2e están documentadas como evidencia (RNF13 = Parcial). Las pruebas **unitarias formales** (PHPUnit/pytest) y la **integración continua** (GitHub Actions) quedan como pendiente de madurez, según `ESTUDIO_CUMPLIMIENTO.md` y `CIERRE_PROYECTO.md`.

## 5. Correcciones realizadas por hallazgos de las pruebas

| Hallazgo | Corrección aplicada |
|---|---|
| Token vencido no rechazaba la operación | Validación `expires_at > NOW()` en `AuthDAO::validarToken` y respuestas 401. |
| Un usuario podía operar plantillas/sesiones ajenas | Cláusulas de propiedad (`usuario_id = ?`, `verificarAcceso`, `buscarAccesible`) en todos los DAOs. |
| Logros se reinsertaban duplicados | `ON CONFLICT (usuario_id, codigo) DO NOTHING` en `LogroDAO::evaluar`. |
| Nombres de ejercicios con acentos partían rachas | Normalización sin acentos/mayúsculas en `RecordDAO::normalizar`. |
| Valores fuera de rango en el cuestionario | Validaciones de rango en `perfil.php` (400) y `min`/`max` en el frontend. |