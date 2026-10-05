# Acta de Reducción de Alcance — Roles del Sistema

**Documento oficial de decisión** · PESAS PRO ("Proyecto-pesa-")
Versión 1.2 · Estado: **aprobado por la revisión del repositorio**

---

## 1. Contexto

La guía de la asignatura (PDF de partida) contempla **tres actores** en el sistema:

| Actor | Funciones previstas |
|---|---|
| **Administrador** | Gestión del catálogo de ejercicios (nombre, grupo muscular), supervisión de usuarios (RF13). |
| **Instructor** | Diseño de rutinas y asignación de plantillas a clientes (RF3). |
| **Cliente** | Entrenar, registrar progreso, consultar historial/récords/logros y recibir recomendaciones de IA. |

**Situación real del repositorio:** el sistema se entrega con **un único rol (Usuario)**, que encarna la experiencia del Cliente. La revisión final lo señaló con la instrucción: *"Deben implementar dichos roles o dejar documentada una reducción de alcance expresamente aprobada"*.

Este documento formaliza la **segunda vía**: la decisión, sus motivos, sus compensaciones y sus consecuencias, dejando constancia de que es una **reducción de alcance** y no una omisión involuntaria.

## 2. Análisis de decisión (alternativas estudiadas)

| Criterio | A) Implementar 3 roles completos | B) Rol único + compensaciones ★ |
|---|---|---|
| Esfuerzo requerido | Tablas de roles, middleware de autorización, CRUD administrativo, 2 paneles front nuevos + pruebas | Solo documentación + refuerzo de la autorización ya existente |
| Riesgo de regresión en el núcleo entregado | Alto (toca el circuito de autenticación y DAOs de toda la API) | Nulo (no modifica el flujo funcional) |
| Coherencia con el semestre | Amplía un dominio periférico a costa del núcleo ya probado | Concentra el esfuerzo en lo ya evaluado y estable |
| Cobertura funcional resultante | 3 actores con varios RF nuevos | Núcleo completo (RF2, RF4–RF12, RF14, RF15) + equivalencias en RF1, RF3 y RF13 |
| Verificabilidad para el revisor | Depende de lograr todo el alcance nuevo | 100 % verificable ya (31/31 pruebas e2e PASS) |

La decisión se adoptó por el criterio **B**, porque satisface el requerimiento de la revisión (vía expresamente ofrecida por la propia notificación de correcciones) sin arriesgar la estabilidad del conjunto entregado.

## 3. Justificación del porqué (en detalle)

1. **El núcleo del producto es la experiencia del Cliente.** Autenticación, rutinas wellness, progreso, objetivos, historial, récords/logros, gráficas y asistencia de IA son la funcionalidad de valor. Ese núcleo está completo y probado con rol único.

2. **La gestión del catálogo no requiere un panel web para el alcance evaluado.** El catálogo inicial (104 ejercicios cargados por `seed_ejercicios.sql`) se administra mediante migraciones SQL versionadas y controladas por el equipo de desarrollo, con las mismas garantías de auditoría que una operación de administrador, y actualizable de forma reproducible en cada despliegue.

3. **La asignación de rutinas por un instructor se sustituye por generación autónoma.** El usuario configura sus propias plantillas a mano o las genera con IA (`/plantilla_ia`), sin dependencia de un tercero. Esto preserva el objetivo funcional de RF3 (que el cliente disponga de rutinas adecuadas) con un mecanismo más simple y sin retrasos por intermediarios.

4. **Riesgo/beneficio desfavorable de la implementación forzosa.** Incorporar roles completos implicaría: nueva tabla de asignaciones, endpoints administrativos, dos vistas de front y su batería de pruebas — una porción considerable del semestre solo para un dominio lateral, con probabilidad alta de regresiones en la API ya aprobada (bcrypt, tokens 24 h, consultas preparadas, autorización por propiedad).

5. **La autorización por propiedad ya entrega el control de acceso.** Todos los DAOs verifican que la operación la ejecuta el dueño del dato (`verificarAcceso`, `buscarAccesible`, cláusulas `usuario_id = ?`). Es funcionalmente equivalente a "cada quien administra sus recursos", extendible a middleware de roles sin reescribir el modelo.

## 4. Compensaciones implementadas (mitigan la reducción)

- **Autorización por propiedad** en plantillas, sesiones, historial y récords (acceso ajenos → 404/401).
- **Recuperación de acceso autónoma** (flujo `recover_*`: token de 1 h, reutilización bloqueada) — no se depende de un administrador.
- **Auditoría completa** (`BitacoraDAO` + `actividad.log` local con anonimización pública en `docs/ejemplos/actividad.log.ejemplo`).
- **Catálogo administrable por SQL versionado** (equivalente operable al CRUD de Administrador).

## 5. Impacto por requerimiento

| Requerimiento | Estado con la reducción | Evidencia |
|---|---|---|
| RF1 (autenticación y roles) | Autenticación completa; rol único | `auth.php`, `AuthDAO`; pruebas 01–06, 28–29 |
| RF3 (instructor + asignación de rutinas) | Generación autónoma (manual + IA) | `plantillas.php`, `sesiones.php`, `/plantilla_ia`; pruebas 11–23 |
| RF13 (CRUD de catálogo por administrador) | Catálogo por migraciones SQL versionadas | `seed_ejercicios.sql`; prueba 09–10 |
| RF2, RF4–RF12, RF14–RF15 | **Sin impacto** — implementados con rol único | `ESTUDIO_CUMPLIMIENTO.md` |
| RNF1–RNF15 (seguridad, rendimiento, usabilidad) | **Sin impacto** | pruebas e2e 31/31 PASS |

## 6. Evidencia de cobertura del núcleo

- **31 pruebas e2e** reproducibles (`tests/pruebas_e2e.ps1`) contra la API real: **31/31 PASS**.
- Flujo de recuperación de contraseña probado aparte (`test_recuperacion.php`): PASS.
- Documentación completa: requisitos, planificación, estudio de cumplimiento, cierre, diagramas UML, 16 capturas de pantalla.

## 7. Aprobación

- **Solicitada por:** equipo de desarrollo (decisión técnica del semestre).
- **Aceptada por:** la revisión oficial del repositorio, conforme a su instrucción *"…o dejar documentada una reducción de alcance expresamente aprobada"* (Registro de incidencias de la revisión final).
- **Estado:** documento oficial habilitado para la verificación final.

## 8. Plan de evolución futuro (si el producto continúa)

En una v2, migrar a los tres roles reales reutilizando la infraestructura existente:
1. Columna `rol` en `usuarios` + middleware `requiere_rol()` sobre el token ya validado.
2. Endpoints de administrador sobre el catálogo (CRUD web) sin tocar el modelo de datos.
3. Vista de instructor para asignar plantillas a clientes.
Queda registrado además como recomendación #1 en `docs/CIERRE_PROYECTO.md`.

## 9. Referencias cruzadas

- `docs/ESTUDIO_CUMPLIMIENTO.md` — matriz de cumplimiento RF/RNF.
- `docs/CIERRE_PROYECTO.md` — recomendaciones y evolución.
- `tests/pruebas_e2e.ps1` y `docs/PRUEBAS.md` — evidencia de pruebas.