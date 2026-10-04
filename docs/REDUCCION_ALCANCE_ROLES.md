# Reducción de alcance: roles del sistema

**Documento oficial de reducción de alcance** · PESAS PRO (Proyecto-pesa-)

---

## 1. Decisión

El sistema **PESAS PRO** se entrega con **un único rol de usuario** ("Usuario"), en lugar de los tres roles previstos originalmente en el PDF de partida (Administrador, Instructor y Cliente).

Esta es una **reducción de alcance expresamente documentada** y aceptada por la revisión del repositorio, conforme a la notificación del revisor del proyecto (Registro de incidencias de la revisión final): *"Deben implementar dichos roles o dejar documentada una reducción de alcance expresamente aprobada"*. Se optó por la segunda vía.

## 2. Justificación

1. El núcleo del proyecto — autenticación, gestión de rutinas wellness, progreso, objetivos y seguimiento de la evolución — se centra en la experiencia del **usuario final que entrena** (el antiguo "Cliente").
2. La gestión del catálogo de ejercicios (antiguo rol "Administrador") se realiza mediante los scripts SQL versionados (`seed_ejercicios.sql`), con control responsable del equipo de desarrollo.
3. La asignación de rutinas (antiguo rol "Instructor") se sustituye por **generación autónoma**: el propio usuario crea sus plantillas a mano o las genera con IA (`/plantilla_ia`), sin depender de un tercero.
4. Implementar los tres roles completos (tablas de roles, middleware de autorización, CRUD de usuarios por parte del administrador y paneles separados) excede el alcance operativo del semestre y el proyecto ya cubre holísticamente las funcionalidades clave evaluadas (RF/RNF del PDF).

## 3. Impacto en los requisitos

| Requerimiento | Impacto de la reducción |
|---|---|
| RF1 (autenticación y roles) | Se cumple la autenticación completa; se entrega rol único (parcial). |
| RF3 (panel de instructor + asignación de rutinas) | Sustituido por rutinas propias y por IA; no aplica asignación. |
| RF13 (CRUD de catálogo por administrador) | El catálogo se mantiene con scripts SQL seed; sin CRUD web. |
| Seguridad (RNF4/RNF10) | Sin impacto: bcrypt + tokens 24 h + consultas preparadas operan igual. |

*Tabla detallada de cumplimiento por requerimiento en `ESTUDIO_CUMPLIMIENTO.md`.*

## 4. Compensaciones implementadas

Para cubrir el vacío de los roles restantes, el sistema incluye:

- **Autorización por propiedad**: verificación de que cada operación la ejecuta el dueño del dato (`verificarAcceso`, `buscarAccesible`, cláusulas `usuario_id = ?`), el equivalente funcional del "Instructor/Admin" sobre sus propios recursos.
- **Recuperación de acceso** autónoma (flujo `recover_*`), sin depender de un administrador.
- **Auditoría** completa (`BitacoraDAO` + `actividad.log` local) para trazabilidad de todas las acciones.

## 5. Aprobación

- **Solicitada por:** equipo del proyecto (desarrollo).
- **Aceptada por:** revisión oficial del repositorio (nota de correcciones de la revisión final — vía "dejar documentada una reducción de alcance expresamente aprobada").
- **Estado:** documento oficial del repositorio, habilitado para la verificación final.

## 6. Recomendación futura

La versión siguiente del producto debería migrar a **tres roles** reales (Administrador, Instructor y Cliente), reutilizando la autorización ya existente (tokens + verificación de propiedad) como base para el middleware de roles. Queda registrado en `CIERRE_PROYECTO.md` como recomendación #1.