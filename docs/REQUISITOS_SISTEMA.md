# Especificación de Requisitos del Sistema — PESAS PRO

Este documento complementa a `REQUERIMIENTOS_CONSOLIDADOS.md` (que contiene los **RF** y **RNF** detallados con su estado de implementación y matrices). Aquí se definen los elementos exigidos: **necesidades identificadas**, **actores y funciones principales** y **requisitos de datos / base de datos**.

---

## 1. Necesidades identificadas

| # | Necesidad detectada |
|---|---|
| N1 | La persona que entrena no sabe qué rutina seguir según su objetivo (fuerza, hipertrofia, resistencia). |
| N2 | No existe registro del progreso: peso levantado, repeticiones y series realizadas a lo largo del tiempo. |
| N3 | No hay seguimiento de la evolución: marcas (récords), rachas de constancia y volumen de entrenamiento. |
| N4 | Las rutinas "de internet" no se adaptan a los días disponibles ni al nivel del usuario. |
| N5 | Los usuarios requieren motivación e incentivos para mantener la constancia (metas, medallas, feedback). |
| N6 | Falta trazabilidad: poder saber qué acciones se realizaron en el sistema y cuándo (bitácora). |
| N7 | La generación de rutinas personalizadas debe ser posible sin pagar, sin tener GPU ni conexión a servicios de IA (motor heurístico local como respaldo). |
| N8 | El sistema debe ser seguro: las contraseñas no se almacenan en texto plano y cada operación controla quién la realiza (token de sesión). |

**Respondido por el sistema con:** cuestionario inicial (N1, N4), historial + gráficas (N2), récords/rachas (N3), logros (N5), bitácora (N6), IA en cascada Gemini → Ollama → heurística (N7), bcrypt + tokens de 24 h (N8).

---

## 2. Actores y funciones principales

| Actor | Descripción | Funciones principales |
|---|---|---|
| **Usuario** (rol único implementado) | Cualquier persona registrada en el sistema. | Autenticarse (registro, login, logout, recuperar contraseña); completar el cuestionario de perfil; explorar el catálogo de ejercicios; crear/editar/eliminar plantillas; generar rutinas con IA; iniciar y completar sesiones de entrenamiento; ver historial, gráficas, récords, logros y recomendaciones. |
| **Servicio IA (Gemini / Ollama / heurística)** | Microservicio externo/local que genera o analiza. | Generar rutinas (`/plantilla_ia`); proyecciones, distribución de intensidad, rachas y recomendaciones (`/analisis/*`, `/recomendaciones_ia`). |
| **Administrador de la base de datos** (operativo) | Quien mantiene PostgreSQL. | Crear la base, ejecutar los scripts SQL y los seeds; supervisar la bitácora. |

> **Nota de coherencia con el PDF de partida:** el documento original contemplaba tres roles (Administrador, Instructor y Cliente). En la versión implementada **existe un único rol de Usuario**; esto está declarado como brecha de cumplimiento en `ESTUDIO_CUMPLIMIENTO.md` (RF1), con plan futuro de migrar a tres roles.

---

## 3. Requisitos de datos y base de datos

**Motor:** PostgreSQL 12+ · **Base de datos:** `pesas` en `localhost:5432` · **Esquema creado por:** `crea_tablas.sql` + `migracion_plantillas.sql`.

### Tablas (11)

| Tabla | Contenido |
|---|---|
| `usuarios` | Usuarios registrados (email, contraseña bcrypt, nombre, nivel) **+ datos del cuestionario** (peso, edad, altura, género, objetivo, nivel_experiencia, dias_semana, cuestionario_completado) + progresión (xp, nivel, nivel_progresion_on). |
| `sesiones` | Tokens de sesión activos: token (64 caract.), usuario_id, expires_at (24 h). |
| `password_resets` | Tokens de recuperación de contraseña (expiración 1 h, flag `usado`). |
| `ejercicios` | Historial operativo del usuario: nombre, peso, series, reps, creado_en. Alimenta volumen, récords y rachas. |
| `historial` | Registro de récords: marca nueva por ejercicio (tipo, valor, peso, series, reps). |
| `ejercicios_catalogo` | Catálogo base (104 ejercicios): nombre, foto, grupo muscular, descripción, pasos. |
| `plantillas` | Rutinas: nombre, descripción, tipo, nivel, `es_sistema`, dias_por_semana, usuario propietario. |
| `plantilla_ejercicios` | Detalle de cada plantilla: ejercicio del catálogo, series, reps, peso_base, orden, descanso_segundos. |
| `sesiones_entrenamiento` | Sesión ejecutada: plantilla, nivel previo, xp ganado, fechas, completada. |
| `sesion_ejercicios` | Ejercicio dentro de una sesión: series/reps/peso completados, descanso activo, momento de inicio/fin. |
| `logros` | Medallas desbloqueadas por usuario (codigo, desbloqueado_en). |

### Reglas de datos (RD)

| # | Regla |
|---|---|
| RD1 | Las contraseñas se guardan **solo** como hash bcrypt (`password_hash`). |
| RD2 | Los tokens se generan con `random_bytes(32)` → 64 caracteres hexadecimales; expiran a las 24 h (sesiones) o a la 1 h (reseteo). |
| RD3 | Todo acceso a datos se hace con **consultas preparadas (PDO)**, nunca concatenando valores del usuario. |
| RD4 | El catálogo de ejercicios es de solo lectura para el usuario; la modificación es responsabilidad del administrador de datos (script SQL). |
| RD5 | `es_sistema = TRUE` en `plantillas` = plantillas precargadas visibles para todos; el resto pertenece al `usuario_id` que las creó (verificación de propiedad en cada operación). |
| RD6 | Una plantilla que ya tiene sesiones registradas no puede eliminarse (bloqueo elegante). |
| RD7 | Toda mutación relevante se registra en la bitácora (fecha, usuario, acción, detalle). |
| RD8 | Los datos sensibles (credenciales de BD y key de IA) se leen de `.env`; nunca desde el código. |

---

## 4. Referencias

- `REQUERIMIENTOS_CONSOLIDADOS.md` → RF y RNF consolidados con matriz de priorización y roadmap.
- `ESTUDIO_CUMPLIMIENTO.md` → auditoría del cumplimiento del PDF de partida.
- `crea_tablas.sql`, `migracion_plantillas.sql`, `seed_ejercicios.sql`, `seed_plantillas.sql` → esquema y datos.