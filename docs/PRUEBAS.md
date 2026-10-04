# Pruebas y Calidad — PESAS PRO

Evidencia de las pruebas ejecutadas sobre la versión final del sistema (rama `main`).

---

## 1. Mecanismo reproducible

Las **31 pruebas e2e** se ejecutan mediante el script:

```
tests/pruebas_e2e.ps1
```

Este script es el **único punto de origen de la evidencia** (quedaba documentado "31/31 PASS" pero el script que lo reproduce no estaba en el repositorio; esta corrección lo incorpora).

### Requisitos para ejecutarlo

1. **PostgreSQL** corriendo en `localhost:5432` con la base `pesas` (esquema y seeds aplicados).
2. **Servidor PHP** activo: `php -S 127.0.0.1:8000 -t .` (la API queda en `/api`).
3. **Microservicio de IA**: `cd python; python app.py` (puerto 5001).

### Cómo ejecutarlo

```powershell
powershell -ExecutionPolicy Bypass -File tests\pruebas_e2e.ps1
```

(Si los servicios están en otro host/puerto, pasarlos: `-ApiBase` y `-IaBase`.)

**Salida esperada:** `RESULTADO FINAL: 31/31 PASS` y código de salida `0`.

### Notas de higiene de datos

- Los usuarios de prueba se crean con el dominio ficticio **`example.com`** (sin datos personales reales).
- La **bitácora local** (`actividad.log`) solo se genera en la máquina de ejecución y **NO se sube al repositorio** (`.gitignore`); como evidencia se usa `docs/ejemplos/actividad.log.ejemplo` (datos ficticios).
- Los usuarios de prueba quedan registrados en la BD; pueden borrarse manualmente con `psql` si se desea mantener la base limpia.

### Prueba complementaria de recuperación de contraseña

El flujo de "olvidé mi contraseña" (token de 1 h, token usado/vencido) se verifica aparte con:

```bash
php test_recuperacion.php
```

Resultado: **PASS** (se probaron tokens válidos, vencidos y ya usados).

## 2. Matriz de las 31 pruebas e2e (idéntica a `tests/pruebas_e2e.ps1`)

| # | Área | Endpoint / flujo | Resultado esperado |
|---|---|---|---|
| 01 | Autenticación | `auth.php → registro` | 200 + `success` |
| 02 | Autenticación | `auth.php → registro` (email repetido) | 409 |
| 03 | Autenticación | `auth.php → login` (credenciales correctas, token de 64 caracteres) | 200 + `token` |
| 04 | Autenticación | `auth.php → login` (contraseña incorrecta) | 401 |
| 05 | Autenticación | `auth.php → validar` (token vigente) | 200 + `success` |
| 06 | Autenticación | `auth.php → validar` (token inválido) | 401 |
| 07 | Perfil | `perfil.php → guardar_cuestionario` (rango válido) | 200 + `success` |
| 08 | Perfil | `perfil.php → guardar_cuestionario` (peso = 0) | 400 |
| 09 | Catálogo | `plantillas.php → catalogo` (104 ejercicios) | 200, ≥ 1 ejercicio con `id` |
| 10 | Catálogo | `plantillas.php → catalogo&grupo=pecho` (filtro) | 200 + `success` |
| 11 | Plantillas | `plantillas.php → crear` (manual, 2 ejercicios) | 200 + `plantilla_id` |
| 12 | Plantillas | `plantillas.php → crear` (11 ejercicios, máximo 10) | 400 |
| 13 | Plantillas | `plantillas.php → listar` (contiene la creada) | 200 + coincide `id` |
| 14 | Plantillas | `plantillas.php → obtener` (detalle con ejercicios) | 200 + ejercicios ≥ 1 |
| 15 | Plantillas | `plantillas.php → eliminar` (plantilla propia) | 200 + `success` |
| 16 | Plantillas | Usuario B: `registro` + `login` | 200 + `tokenB` |
| 17 | Plantillas | `obtener` plantilla ajena con token de B | 404 |
| 18 | Sesiones | `sesiones.php → iniciar` (desde plantilla) | 200 + `sesion_id` |
| 19 | Sesiones | `sesiones.php → obtener` (ejercicios con su `id`) | 200 + `ejercicios[0].id` |
| 20 | Sesiones | `sesiones.php → completar_ejercicio` | 200 + `success` |
| 21 | Sesiones | `iniciar_descanso` + `fin_descanso` | 200 + `success` |
| 22 | Sesiones | `sesiones.php → finalizar` (XP ≥ 50) | 200 + `xp_ganado ≥ 50` |
| 23 | Sesiones | `obtener` sesión ajena con token de B | 404 |
| 24 | Historial | `agregar_ejercicio.php → agregar_ejercicio` (volumen > 0) | 200 + `volumenTotal > 0` |
| 25 | Historial | `agregar_ejercicio.php → listar` | 200 + `totalEjercicios ≥ 1` |
| 26 | Récords | `records.php → listar` (records, racha, stats, logros) | 200 + campo `logros` |
| 27 | Bitácora | `bitacora.php → listar` | 200 + `entradas ≥ 1` |
| 28 | Autenticación | `auth.php → logout` | 200 + `success` |
| 29 | Autenticación | `auth.php → validar` tras logout | 401 |
| 30 | IA | `GET /analisis/progreso?token=` (`:5001`) | 200 + `success` |
| 31 | IA | `POST /plantilla_ia` (generación y guardado) | 200 + `success` + ejercicios |

**Resultado global: 31/31 PASS** — sin fallos en la versión final.

## 3. Pruebas unitarias e integración continua

- Las pruebas unitarias formales (PHPUnit/pytest) y la integración continua (GitHub Actions) **no se implementaron**; quedan declaradas como pendiente de madurez en `ESTUDIO_CUMPLIMIENTO.md` (RNF13) y `CIERRE_PROYECTO.md`. La corrección del revisor no lo exige ("No es necesario crear retrospectivamente Pull Requests o GitHub Actions").

## 4. Correcciones realizadas por hallazgos de las pruebas

| Hallazgo | Corrección aplicada |
|---|---|
| Token vencido no rechazaba la operación | Validación `expires_at > NOW()` en `AuthDAO::validarToken` y respuestas 401. |
| Un usuario podía operar plantillas/sesiones ajenas | Cláusulas de propiedad (`usuario_id = ?`, `verificarAcceso`, `buscarAccesible`) en todos los DAOs. |
| Logros se reinsertaban duplicados | `ON CONFLICT (usuario_id, codigo) DO NOTHING` en `LogroDAO::evaluar`. |
| Nombres de ejercicios con acentos partían rachas | Normalización sin acentos/mayúsculas en `RecordDAO::normalizar`. |
| Valores fuera de rango en el cuestionario | Validaciones de rango en `perfil.php` (400) y `min`/`max` en el frontend. |