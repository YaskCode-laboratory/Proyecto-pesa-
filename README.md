# PESAS PRO — Sistema de Gestión de Rutinas Wellness

**Proyecto-pesa-** · Gestor de rutinas de entrenamiento con inteligencia artificial, desarrollado en semestre para la asignatura de Programación Orientada a Objetos.

PESAS PRO es una aplicación web completa (frontend + backend + base de datos + microservicio de IA) que permite a una persona registrarse, completar su perfil de entrenamiento, explorar un catálogo de ejercicios, crear sus propias rutinas (a mano o generadas por IA), registrar sus sesiones de entrenamiento y seguir su evolución con historial, gráficas, récords y logros.

---

## Problema que aborda

La mayoría de las personas que van al gimnasio entrenan sin planificación ni registro: no saben qué rutina seguir según su objetivo, no llevan control del peso levantado ni de sus marcas, y no tienen forma de medir su progreso en el tiempo. Las aplicaciones comerciales suelen ser de pago o dependen de suscripciones.

Este sistema resuelve ese vacío con una solución gratuita, local y personalizable:

- Rutinas adecuadas al objetivo (fuerza, hipertrofia o resistencia) y al nivel del usuario.
- Seguimiento completo del progreso (volumen semanal, récords, rachas, logros).
- Generación de rutinas por IA sin costo (Gemini → Ollama → motor heurístico).

## Área de wellness

**Acondicionamiento físico y musculación** (wellness/fitness). El sistema se enfoca en el plan "Empuje · Tirón · Pierna", fuerza máxima, hipertrofia y acondicionamiento general, con control de hidratación y descanso.

## Objetivo

Construir un sistema web funcional y seguro que gestione a los usuarios, sus rutinas de entrenamiento, su progreso y sus objetivos, integrando IA para personalizar las rutinas y recomendar acciones, con una arquitectura en capas y aplicación real de Programación Orientada a Objetos.

## Funcionalidades principales

- **Autenticación y seguridad**: registro, inicio de sesión, cierre de sesión y recuperación de contraseña con tokens de sesión de 24 h y contraseñas cifradas con bcrypt.
- **Perfil / cuestionario inicial**: peso, edad, altura, género, objetivo, nivel y días de entrenamiento por semana.
- **Catálogo de ejercicios**: 104 ejercicios precargados con foto, grupo muscular, descripción y pasos, con filtros por grupo y búsqueda instantánea.
- **Plantillas (CRUD)**: crear, listar, ver detalle, renombrar y eliminar rutinas propias; 8 plantillas preestablecidas en la base de datos.
- **Generación de rutinas con IA**: endpooint `/plantilla_ia` en cascada (Gemini → Ollama → heurística) que genera y guarda la plantilla con pesos sugeridos.
- **Sesiones de entrenamiento**: iniciar/finalizar sesiones, marcar ejercicios completados, descanso temporizado (máx. 30 min) e hidratación, XP y niveles.
- **Seguimiento y estadísticas**: historial de ejercicios, gráficas de volumen e intensidad (Chart.js), récords por ejercicio, rachas, medallas/logros.
- **Analítica e IA**: proyección de progreso, distribución de intensidad, recomendaciones personalizadas (consejo, racha, ejercicios estancados y no realizados).
- **Bitácora**: registro auditable de las acciones del usuario (fecha, usuario, acción, detalle).
- **Récords y logros**: detección en vivo de "¡Nuevo récord!" y 16 medallas desbloqueables.

## Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3 (diseño original v2026), JavaScript (vanilla), CDNs de Chart.js, Font Awesome y EmailJS |
| Backend | PHP 8 (API REST en JSON, sin framework), servidor PHP integrado en `:8000` |
| Base de datos | PostgreSQL (`localhost:5432`, base `pesas`) |
| IA | Python 3 + Flask (microservicio `:5001`), API de Gemini (opcional), Ollama (opcional), motor heurístico local |
| Seguridad | Tokens aleatorios de 64 caracteres (24 h), bcrypt, consultas preparadas, `.env` oculto |

## Arquitectura / diseño

Arquitectura en **capas** con separación de responsabilidades:

```
Navegador (HTML/CSS/JS)          → presentación (frontend)
        │  fetch() + JSON {action, token, ...}
        ▼
api/*.php (controladores)         → lógica de negocio
        │  AuthDAO::validarToken() · sin SQL directo
        ▼
dao/*.php (acceso a datos)        → patrón DAO + Singleton (Conexion::get())
        │  PDO · consultas preparadas
        ▼
PostgreSQL «pesas»                → persistencia (11 tablas)
```

Además, un **microservicio Python (Flask)** en `http://127.0.0.1:5001` atiende la IA: genera rutinas, responde proyecciones y recomendaciones, validando el token contra la misma tabla `sesiones`.

Diagramas UML (diagrama de clases y casos de uso) en [`docs/diagramas/`](docs/diagramas/).

## IA utilizada

Motor **híbrido en cascada** implementado en `python/app.py`:

1. **Gemini** (API gratuita) — si hay `GEMINI_API_KEY` en el `.env`.
2. **Ollama** (local) — como respaldo si Gemini falla o no hay key.
3. **Heurística local** — última instancia (siempre disponible, sin conexión).

Endpoints del microservicio (`:5001`):

- `POST /plantilla_ia` → genera y guarda una rutina según objetivo, nivel y días.
- `GET /analisis/progreso`, `/analisis/proyeccion`, `/analisis/distribucion`, `/analisis/racha`, `/analisis/recomendaciones`, `/analisis/volumen_por_grupo`.
- `GET /recomendaciones_ia` → consejo personalizado + racha + estancados + no realizados.

La clave `GEMINI_API_KEY` vive **solo en el archivo `.env`** (ignorado por Git, nunca se sube al repositorio).

## Instalación y ejecución

### Requisitos

- **PHP 8** (con extensión `pdo_pgsql`).
- **PostgreSQL** corriendo en `localhost:5432`.
- **Python 3** con `flask` y `psycopg2` (para el microservicio de IA).

### Pasos

1. **Crear la base de datos** (una sola vez):

   ```bash
   psql -U postgres -c "CREATE DATABASE pesas;"
   psql -U postgres -d pesas -f crea_tablas.sql
   psql -U postgres -d pesas -f migracion_plantillas.sql
   psql -U postgres -d pesas -f seed_ejercicios.sql
   psql -U postgres -d pesas -f seed_plantillas.sql
   ```

2. **Crear el archivo `.env`** en la raíz del proyecto (nunca subir a Git):

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pesas
   DB_USER=postgres
   DB_PASS=tu_contrasena
   # IA (opcional): sin key se usa el motor heurístico
   GEMINI_API_KEY=
   GEMINI_MODEL=gemini-3.8-flash
   ```

3. **Iniciar el servidor web (frontend + API PHP):**

   ```bash
   php -S 127.0.0.1:8000 -t .
   ```

   (En Windows también puede usarse `Iniciar_Web_PHP.bat`.)

4. **Iniciar el microservicio de IA (opcional):**

   ```bash
   cd python
   python app.py
   ```

   (En Windows también puede usarse `Iniciar_Microservicio_IA.bat`.)

5. **Abrir el sistema:** http://127.0.0.1:8000

   El microservicio de IA queda en http://127.0.0.1:5001 (su documentación está en `/`).

## Pruebas

- **31 pruebas end-to-end (e2e)** por línea de comandos (PowerShell) contra la API real: autenticación, cuestionario, plantillas, sesiones, descanso, récords, logros, recuperación de contraseña y bitácora — **todas PASS**.
- `test_recuperacion.php`: prueba del flujo completo de recuperación de contraseña (token de 1 h).
- Detalle de casos, resultados y correcciones en [`docs/PRUEBAS.md`](docs/PRUEBAS.md).

## Equipo

- **Félix Ricardo Aranguren Martínez** — desarrollo completo: frontend, backend PHP, base de datos, microservicio de IA, pruebas y documentación.

> *Si el equipo de la asignatura incluye más integrantes, registrar aquí sus nombres y responsabilidades.*

## Evidencias / capturas

Carpeta para evidencias: [`docs/capturas/`](docs/capturas/) (pantallas de Login, Panel, Cuestionario, Catálogo, Plantillas, Sesión, Gráficas, Récords y Logros). Las capturas se añaden a medida del avance del Sprint.

## Estado del proyecto

**Funcionando correctamente** en entorno local con PostgreSQL. Cumplimiento estimado de **75–80 %** sobre el PDF de partida (ver [`ESTUDIO_CUMPLIMIENTO.md`](ESTUDIO_CUMPLIMIENTO.md)).

Pendientes documentados:
- Roles diferenciados (Administrador/Instructor/Cliente) — RF1, RF3, RF13.
- Videos de YouTube embebidos en el catálogo — RF5.
- Pruebas unitarias formales (PHPUnit/pytest) — RNF13.
- Despliegue en la nube e integración continua (GitHub Actions) — RNF12.