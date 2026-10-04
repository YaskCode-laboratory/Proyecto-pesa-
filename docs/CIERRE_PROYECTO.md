# Cierre del Proyecto — PESAS PRO

Síntesis final del desarrollo: logros, dificultades y soluciones, aplicación de la POO, recomendaciones para futuras versiones, procedimiento de despliegue/ejecución, mantenimiento y conclusiones.

---

## 1. Logros alcanzados

- Sistema web **completo y funcional**: frontend + API PHP + base de datos PostgreSQL + microservicio de IA en `:5001`.
- **Autenticación segura**: registro, login, logout y recuperación de contraseña con tokens de 24 h y bcrypt.
- **Perfil personalizado** con cuestionario inicial (peso, edad, altura, género, objetivo, nivel, días de entrenamiento).
- **Catálogo de 104 ejercicios** con foto, descripción, pasos y filtros por grupo muscular.
- **Plantillas**: CRUD completo (crear/listar/detalle/renombrar/eliminar) + 8 plantillas precargadas.
- **Rutinas generadas por IA** con motor híbrido gratuito (Gemini → Ollama → heurística) que se guardan en la base con pesos sugeridos.
- **Sesiones de entrenamiento** con descansos temporizados, hidratación, XP y niveles.
- **Seguimiento de evolución**: historial, gráficas de volumen e intensidad (Chart.js), récords por ejercicio, rachas y **16 logros/medallas**.
- **Recomendaciones con IA** (consejo, racha, estancados y no realizados) integradas en el panel de Rutinas.
- **Bitácora auditable** de todas las acciones del sistema.
- **31 pruebas e2e PASS** sobre la API real + flujo e2e de recuperación de contraseña.
- **31** requerimientos evaluados (15 RF + 15 RNF + IA), cumplimiento global estimado 75–80 % (ver `ESTUDIO_CUMPLIMIENTO.md`).

## 2. Dificultades encontradas y soluciones adoptadas

| Dificultad | Solución aplicada |
|---|---|
| Depender de IA de pago para generar rutinas | Se construyó un **motor en cascada**: Gemini (gratuita) → si falla, Ollama local → si también falla, **heurística propia** en Python. El sistema funciona sin conexión. |
| Evitar que las credenciales se filtraran al subir el repositorio | Credenciales movidas a `.env` (fuera de Git), auditoría de historial y escaneo con `git grep` antes de cada push. |
| Garantizar que un usuario no accediera a datos de otros | Verificación de propiedad en cada operación (`verificarAcceso`, `buscarAccesible`, cláusulas `AND usuario_id = ?` en los DAOs). |
| Mantener la integridad de las rutinas precargadas | Flag `es_sistema` en `plantillas` y bloqueo elegante al eliminar plantillas que ya tienen sesiones. |
| Cálculo de récords y rachas correctos | Normalización de nombres (sin distinguir mayúsculas/acentos) en `RecordDAO` y consultas por `DATE(creado_en)` para la racha. |
| Diagramas UML desactualizados respecto al código final | Diagramas regenerados a partir de los métodos reales de los DAOs en `docs/diagramas/`. |
| Pruebas repetitivas sobre la API | Script e2e automatizado (PowerShell) con cabeceras por grupo de funcionalidad; 31 casos PASS. |

## 3. Aplicación de principios de Programación Orientada a Objetos

- **Encapsulamiento**: las clases `dao/*.php` exponen métodos de dominio (`AuthDAO::validarToken`, `PlantillaDAO::crear`, `SesionEntrenamientoDAO::finalizar`) y ocultan el acceso directo a PDO/SQL. Cero SQL en `api/*.php`.
- **Patrón Singleton**: `Conexion::get()` devuelve una única conexión PDO por proceso (constructor y clon privados), garantizando RNF7.
- **Separación de responsabilidades (SRP)**: un DAO por entidad (Usuario, Auth, Plantilla, Sesión, Ejercicio, Record, Logro, Bitácora).
- **Arquitectura en capas**: presentación → controladores (`api/`) → acceso a datos (`dao/`) → PostgreSQL.
- **Reutilización**: transacciones y métodos comunes (normalización de nombres, evaluador de logros) reutilizados por varios endpoints.

## 4. Recomendaciones para futuras versiones

1. **Roles diferenciados** (Administrador, Instructor, Cliente) con asignación de rutinas y panel de administración (RF1/RF3/RF13).
2. **Videos de YouTube embebidos** en el catálogo de ejercicios (RF5).
3. **Pruebas unitarias formales** (PHPUnit + pytest) e integración continua con GitHub Actions (RNF12/RNF13).
4. **Despliegue en la nube** (Render/Railway/Heroku o GitHub Pages + backend) con PostgreSQL administrado (RNF12).
5. **Captura de porcentaje de grasa corporal** y métricas avanzadas en el perfil (RF2).
6. Exportación de datos (historial y estadísticas a CSV/PDF) y modo "Entrenador" que sugiera ajustes de cargas.

## 5. Despliegue / procedimiento de ejecución

El procedimiento es **reproducible** desde el repositorio (detallado en `README.md`):

1. Crear la base `pesas` y ejecutar `crea_tablas.sql`, `migracion_plantillas.sql` y los seeds.
2. Crear `.env` con las credenciales locales (plantilla en el README).
3. Iniciar el servidor PHP: `php -S 127.0.0.1:8000 -t .`
4. Iniciar el microservicio: `cd python; python app.py`
5. Abrir http://127.0.0.1:8000

> **Disponibilidad:** la versión actual se ejecuta **en local** (Windows: `Iniciar_Web_PHP.bat` y `Iniciar_Microservicio_IA.bat`). El despliegue en la nube está pendiente y queda documentado como recomendación.

## 6. Mantenimiento

- **Base de datos**: el esquema y los seeds están versionados (`.sql`), de modo que cualquier entorno puede reconstruirse; cambios de estructura se agregan como scripts de migración (`migracion_plantillas.sql`).
- **Catálogo de ejercicios**: se amplía insertando filas en `ejercicios_catalogo` (nombre, foto, grupo, descripción, pasos).
- **Seguridad**: renovar `DB_PASS`/`GEMINI_API_KEY`, rotar tokens de sesión, y **nunca** editar `.env` en el repositorio.
- **Bitácora**: `actividad.log` acumula las acciones solo en la máquina local (está en `.gitignore` por contener datos de usuarios); vigilar su tamaño y rotarlo si crece. Como evidencia pública se usa `docs/ejemplos/actividad.log.ejemplo` (datos ficticios).
- **Versiones**: cada cambio debe reflejarse en `ESTUDIO_CUMPLIMIENTO.md` y, si altera la arquitectura, actualizar los diagramas UML.

## 7. Conclusiones

El proyecto demuestra la construcción de un **sistema real de gestión de rutinas wellness** con aplicación concreta de POO (DAO + Singleton + capas), base de datos relacional, frontend interactivo y un microservicio de IA con motor híbrido gratuito. Se validó la funcionalidad con 31 pruebas e2e y se documentó el repositorio completo para su revisión.

El sistema queda **operativo y estable en `main`**, con las brechas restantes claramente identificadas y planificadas (roles, videos, pruebas unitarias y despliegue en la nube), lo que permite afirmar que la solución responde al problema planteado y es ampliable en versiones siguientes.