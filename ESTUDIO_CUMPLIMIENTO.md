# Estudio de Cumplimiento: Requerimientos del PDF "proyecto pesas-2"
## Proyecto: Sistema de Gestor de Rutinas Wellness con POO / IA – PESAS

**Fecha:** 16 de septiembre de 2026  
**Documento fuente:** `C:\Users\5300\Downloads\proyecto pesas-2.docx.pdf`  
**Ubicación del proyecto:** `C:\Users\5300\Desktop\Felix\pagina web`  

---

## Observaciones generales

El PDF describe un sistema con:
- Backend en **Java/C#**
- Base de datos en **MySQL/SQLite**
- Arquitectura en **capas** y patrones **DAO/Singleton**
- Tres roles: **Administrador, Instructor y Cliente**
- Metodología **Scrum** (equipo de 3 personas)

El proyecto implementado utiliza:
- Backend **PHP** (API, 5 endpoints) + **Python** (microservicio IA en :5001)
- Base de datos **PostgreSQL**
- Frontend **HTML/CSS/JavaScript** (diseño original migrado)
- Autenticación con **tokens de sesión** (24h)
- **Patrones DAO y Singleton implementados** en la capa PHP (`dao/`)
- Roles implementados: **Usuario único** (no se diferencia Admin/Instructor/Cliente). Reducción de alcance documentada y aceptada — ver `docs/REDUCCION_ALCANCE_ROLES.md`.

**Divergencias restantes:**
- Lenguaje backend diferente (PHP/Python vs Java/C#).
- Base de datos PostgreSQL vs MySQL/SQLite.
- No hay diferenciación de roles (RF1/RF3/RF13).

---

## 1. Requerimientos Funcionales (RF)

| Requerimiento | Descripción del PDF | Estado del proyecto | Cumple |
|---|---|---|---|
| **RF1** | Sistema de autenticación y roles (Administrador, Instructor, Cliente) | ✅ Registro e login funcionales (bcrypt + token 24h). ❌ Solo existe un rol de usuario. | **Parcial** |
| **RF2** | Formulario de datos iniciales (peso, % grasa, objetivos: Hipertrofia/Fuerza) en perfil | ✅ Cuestionario inicial completo: peso, edad, altura, género, objetivo, nivel, días/semana. ❌ No se captura % de grasa. | **Parcial** |
| **RF3** | Panel de creación de rutinas por Instructor asignadas a clientes | ❌ No existe panel de instructor ni asignación de rutinas a clientes. | **No cumple** |
| **RF4** | Proyecciones con IA (progreso mensual, aumento de cargas, tiempos estimados) | ✅ Microservicio con `/analisis/progreso`, `/analisis/proyeccion`, `/analisis/distribucion`, `/analisis/racha` y ahora `/recomendaciones_ia` (consejo, racha, estancados, no realizados) integrado en el panel de Rutinas. | **Cumple** |
| **RF5** | Integración multimedia con videos de YouTube embebidos | ❌ El frontend tiene fotos y descripciones en el catálogo, pero no carga videos de YouTube embebidos. | **No cumple** |
| **RF6** | Control de hidratación con alertas temporizadas que pausan el flujo | ✅ Puntos de descanso estilo Leap Fitness: modal que pausa la sesión hasta confirmar hidratación; auto-avance a los 30 min. | **Cumple** |
| **RF7** | Selección de planes de fuerza/musculación (empuje/tirón/pierna, fuerza máxima, hipertrofia) | ✅ 8 plantillas preestablecidas en BD (`plantillas`/`plantilla_ejercicios`): empuje/tirón/pierna, full body, etc. | **Cumple** |
| **RF8** | Generación automatizada de rutinas de pesas por IA (según días y objetivos) | ✅ Motor híbrido gratuito (Gemini → Ollama → heurística): `/plantilla_ia` genera y guarda la plantilla en BD con pesos sugeridos; botón en frontend. | **Cumple** |
| **RF9** | Selección y añadido manual de ejercicios desde catálogo (press banca, sentadillas, curl bíceps) | ✅ Catálogo visual de 104 ejercicios con foto, grupo muscular y filtros; añadido manual a plantillas. | **Cumple** |
| **RF10** | Gestión de plantillas de entrenamiento (CRUD) | ✅ Crear, listar, ver detalle, renombrar/eliminar plantillas propias (bloqueo elegante si la plantilla ya tiene sesiones). | **Cumple** |
| **RF11** | Historial de progresos mensual (pesos levantados, repeticiones completadas) | ✅ Historial en BD (`ejercicios`), gráficas con `Chart.js`, métricas de volumen/intensidad; el microservicio también alimenta proyecciones y rachas. | **Cumple** |
| **RF12** | Módulo de autenticación de usuarios (registro/login) | ✅ Registro, login, validación de sesión y logout con tokens de 24h. | **Cumple** |
| **RF13** | Gestión del catálogo de ejercicios por Administrador (nombre, grupo muscular) | ❌ No hay panel de administración ni CRUD del catálogo. | **No cumple** |
| **RF14** | Recuperación de accesos (contraseña olvidada) | ✅ Flujo completo en `auth.php` (`recover_request`/`recover_reset`) con token de 1h; probado e2e. | **Cumple** |
| **RF15** | Registro/actualización de objetivos del Cliente para proyecciones de IA | ✅ Cuestionario guarda objetivo/nivel/días; la IA usa el perfil para generar plantillas y recomendaciones. | **Cumple** |

**Resumen RF:** Cumple 10, Parcial 2, No cumple 3.

---

## 2. Requerimientos No Funcionales (RNF)

| Requerimiento | Descripción del PDF | Estado del proyecto | Cumple |
|---|---|---|---|
| **RNF1** | Aislamiento de BD (patrón DAO) | ✅ 6 clases DAO (`Conexion`, `AuthDAO`, `UsuarioDAO`, `PlantillaDAO`, `SesionEntrenamientoDAO`, `EjercicioDAO`). Cero SQL en `api/*.php`. | **Cumple** |
| **RNF2** | Arquitectura en capas (presentación, lógica de negocio, acceso a datos) | ✅ Frontend (presentación) → `/api` (controladores) → `/dao` (acceso a datos). Transacciones dentro de los DAOs. | **Cumple** |
| **RNF3** | Diseño UI/UX responsivo Mobile-First | ⚠️ CSS con media queries y diseño adaptable, pero no formalizado como Mobile-First (breakpoints explícitos). | **Parcial** |
| **RNF4** | Cifrado de contraseñas y seguridad de sesiones | ✅ Contraseñas bcrypt, token aleatorio de 64 caracteres, expiración 24h. | **Cumple** |
| **RNF5** | Rendimiento/concurrencia (<3s en conexiones móviles, videos YouTube incluidos) | ⚠️ No hay videos de YouTube aún; rendimiento no medido bajo carga. | **No cumple** |
| **RNF6** | Documentación del backend (estándares) y escalabilidad | ⚠️ Queries documentadas en este estudio y `REQUERIMIENTOS_CONSOLIDADOS.md`; sin PHPDoc formal. | **Parcial** |
| **RNF7** | Conexión única a BD (patrón Singleton) | ✅ `Conexion::get()` devuelve un único PDO por proceso (con `private __construct`/`__clone`). | **Cumple** |
| **RNF8** | Flujos de usuario intuitivos (UX) | ✅ Login → cuestionario → plantillas → sesión → gráficas, con modales de descanso y nivel. | **Cumple** |
| **RNF9** | Validaciones estrictas de entrada (frontend y backend) | ✅ Backend valida rangos (peso/edad/series ≥ 1, reps, token); frontend con `required`/`min`/`type="number"`. | **Cumple** |
| **RNF10** | Cifrado y seguridad de datos (contraseñas + autorización) | ✅ bcrypt + validación de token en cada operación + verificación de propiedad (ej. `verificarAcceso` en sesiones). | **Cumple** |
| **RNF11** | Versionamiento de código con GitHub | ❌ No hay repositorio Git configurado en la carpeta. | **No cumple** |
| **RNF12** | Despliegue en la nube (Heroku, Render, GitHub Pages) | ❌ No está configurado. | **No cumple** |
| **RNF13** | Cobertura de pruebas | ⚠️ 31 pruebas e2e (script PowerShell) ejecutadas y PASS; sin PHPUnit/pytest unitarios formales. | **Parcial** |
| **RNF14** | Diseño interactivo y responsivo (HTML/CSS/JS, adaptación móvil) | ✅ HTML/CSS/JS vanilla con componentes dinámicos (modales, catálogo, selector de plantillas). | **Cumple** |
| **RNF15** | Trazabilidad de errores y documentación de validación | ⚠️ Errores controlados con códigos HTTP (400/401/403/404/409/500) y mensajes JSON coherentes; sin logger persistente. | **Parcial** |

**Resumen RNF:** Cumple 8, Parcial 4, No cumple 3.

---

## 3. Funcionalidades IA implementadas (microservicio Python :5001)

| Funcionalidad IA | Endpoint | Estado |
|---|---|---|
| Tendencia de volumen (regresión lineal) | `/analisis/progreso` | ✅ |
| Proyección de volumen futuro | `/analisis/proyeccion` | ✅ |
| Distribución de intensidad (fuerza/hipertrofia/resistencia) | `/analisis/distribucion` | ✅ |
| Racha de días consecutivos | `/analisis/racha` | ✅ |
| Recomendaciones clásicas (no realizados, estancamiento) | `/analisis/recomendaciones` | ✅ |
| Volumen por grupo muscular | `/analisis/volumen_por_grupo` | ✅ |
| **Generación de rutinas por IA** (Gemini → Ollama → heurística) | `/plantilla_ia` | ✅ Integrada en frontend |
| **Consejo personalizado + racha + estancados + no realizados** | `/recomendaciones_ia` | ✅ Panel en sección Rutinas |

---

## 4. Módulo de Récords y Logros (nuevo)

| Función | Descripción | Estado |
|---|---|---|
| Récords por ejercicio | Peso máximo, volumen máximo, 1RM estimado (Epley) y mejor serie por ejercicio, agrupando por nombre sin distinguir acentos/mayúsculas | ✅ |
| Detección en vivo | Al completar un ejercicio se compara con las marcas previas y se avisa con un toast "¡Nuevo récord!" | ✅ |
| Logros / medallas | 16 logros: racha de 3/7/14/30 días, volumen acumulado (1.000 a 25.000 kg), nº de ejercicios (1-100), nivel (5 y 10) y récords batidos (1 y 10), con barra de progreso y fecha de desbloqueo | ✅ |
| Tabla `historial` | Reutilizada como registro de récords (solo guarda marcas nuevas con fecha) | ✅ |
| Tabla `logros` | Guarda los logros desbloqueados por usuario con fecha | ✅ |
| Capa DAO | `RecordDAO` (récords, rachas) y `LogroDAO` (medallas) — endpoint `api/records.php` | ✅ |

---

## 5. Brechas principales para cumplir el PDF

| Prioridad | Brecha | Módulo implicado |
|---|---|---|
| **Alta** | Diferenciación de roles (Admin/Instructor/Cliente) | Base de datos, auth, frontend |
| **Alta** | RF3: Panel de rutinas con asignación a clientes | Nuevo módulo rutinas |
| **Alta** | RF5: Integración videos de YouTube | Frontend + catálogo |
| **Media** | RF13: Catálogo de ejercicios admin | Panel admin |
| **Media** | RNF3/RNF14: Mobile-First explícito | CSS |
| **Media** | RNF6: PHPDoc formal | Backend |
| **Media** | RNF13: Pruebas unitarias (PHPUnit/pytest) | Backend |
| **Media** | RNF15: Logger persistente | Backend |
| **Baja** | RNF11: Repositorio Git/GitHub | DevOps |
| **Baja** | RNF12: Despliegue en la nube | DevOps |

---

## 6. Conclusión

**Cumplimiento global estimado:** Aproximadamente **75-80%** del PDF.

- **Cumple** autenticación, seguridad, validaciones, UX, plantillas CRUD, catálogo, planes, hidratación, recuperación de contraseña, historial con gráficas, generación de rutinas por IA y recomendaciones personales.
- **Cumple** los requerimientos no funcionales clave: patrón DAO, arquitectura en capas y patrón Singleton.
- **Pendiente mayor:** roles diferenciados (RF1/RF3/RF13), videos de YouTube (RF5), pruebas unitarias formales, Git y despliegue en la nube.

---

*Documento vivo - actualizar al final de cada sprint.*