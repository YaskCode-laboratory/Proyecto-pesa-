# Requerimientos Consolidados: PDF + Recomendaciones Técnicas
## Sistema de Gestión de Rutinas Wellness - PESAS
**Fecha:** 13 de septiembre de 2026  
**Versión:** 1.0

---

## 1. REQUERIMIENTOS FUNCIONALES (RF) CONSOLIDADOS

### 🟢 Ya Implementados (Cumplen)
| ID | Requerimiento | Fuente | Estado | Observaciones |
|----|---------------|--------|--------|---------------|
| RF1 | Sistema de autenticación y roles | PDF | ✅ Parcial | Solo rol "Cliente" implementado |
| RF11 | Historial de progresos | PDF | ⚠️ Parcial | Falta vista mensual histórica |
| RF12 | Módulo de autenticación | PDF | ✅ Completo | Registro, login, sesión, logout |

### 🔴 Alta Prioridad - Core del Producto
| ID | Requerimiento | Fuente | Justificación | Esfuerzo |
|----|---------------|--------|---------------|----------|
| **RF-N1** | **Recuperación de contraseña** | PDF (RF14) + Seguridad | Requisito básico de producción | 🟡 Medio |
| **RF-N2** | **Datos antropométricos** (peso, % grasa, estatura) | PDF (RF2) + Base IA | Base para proyecciones y 1RM | 🟡 Medio |
| **RF-N3** | **Catálogo de ejercicios buscable** | PDF (RF9) + UX | Elimina escritura manual, reduce errores | 🟡 Medio |
| **RF-N4** | **Objetivos del cliente** (hipertrofia/fuerza/mantenimiento) | PDF (RF15) + IA | Requerido para proyecciones RF8 | 🟢 Bajo |
| **RF-N5** | **Generación automática de rutinas por IA** | PDF (RF8) + Diferenciador | Valor único vs competencia | 🔴 Alto |

### 🟠 Media Prioridad - Mejora Experiencia
| ID | Requerimiento | Fuente | Justificación | Esfuerzo |
|----|---------------|--------|---------------|----------|
| **RF-N6** | **Videos YouTube embebidos** | PDF (RF5) | Guía técnica visual, reduce lesiones | 🟡 Medio |
| **RF-N7** | **Planes preestablecidos** (Push/Pull/Legs, Full Body) | PDF (RF7) | Onboarding rápido para novatos | 🟡 Medio |
| **RF-N8** | **Control de hidratación** (alertas temporizadas) | PDF (RF6) | Funcionalidad fitness real | 🟢 Bajo |
| **RF-N9** | **CRUD de plantillas** (guardar/renombrar/eliminar) | PDF (RF10) | Reutilización de rutinas | 🟡 Medio |
| **RF-N10** | **Panel instructor** (asignar rutinas) | PDF (RF3) | Modelo multi-usuario | 🔴 Alto |

### 🔵 Baja Prioridad - Admin & Extras
| ID | Requerimiento | Fuente | Justificación | Esfuerzo |
|----|---------------|--------|---------------|----------|
| **RF-N11** | Panel admin: catálogo ejercicios | PDF (RF13) | Gestión de contenido | 🔴 Alto |
| **RF-N12** | Métricas corporales avanzadas (cintura, pecho, etc.) | Recomendación | Tracking visual | 🟡 Medio |
| **RF-N13** | Exportar datos (PDF/CSV) | Recomendación | Portabilidad de datos | 🟢 Bajo |
| **RF-N14** | Notificaciones push (logros, rachas) | Recomendación | Retención | 🟡 Medio |

---

## 2. REQUERIMIENTOS NO FUNCIONALES (RNF) CONSOLIDADOS

### ✅ Ya Cumplidos
| ID | Requerimiento | Fuente | Estado |
|----|---------------|--------|--------|
| RNF4 | Seguridad web (bcrypt, tokens, HTTPS-ready) | PDF | ✅ |
| RNF8 | UX intuitiva | PDF | ✅ |
| RNF9 | Validaciones estrictas (frontend + backend) | PDF | ✅ |
| RNF10 | Cifrado y seguridad de datos | PDF | ✅ |
| RNF1 | **Patrón DAO** (aislar lógica BD en objetos DAO) | PDF | ✅ Implementado: `dao/Conexion.php`, `AuthDAO`, `UsuarioDAO`, `PlantillaDAO`, `SesionEntrenamientoDAO`, `EjercicioDAO`. Cero SQL en `api/*.php` |
| RNF2 | **Arquitectura en capas** (Presentación → Negocio → Datos) | PDF | ✅ Controladores finos en `api/` + DAOs en `dao/` |
| RNF7 | **Conexión única (Singleton)** | PDF | ✅ `Conexion::get()` asegura un solo PDO (PostgreSQL) por proceso |

### 🔴 Críticos - Arquitectura y Cumplimiento PDF
| ID | Requerimiento | Fuente | Justificación | Esfuerzo |
|----|---------------|--------|---------------|----------|
| **RNF-N1** | **Patrón DAO** (aislar lógica BD) — ✅ COMPLETADO 2026-09-16 | PDF (RNF1) | Requisito explícito del PDF, mantenibilidad | 🟡 Medio |
| **RNF-N2** | **Arquitectura en capas** — ✅ COMPLETADO 2026-09-16 | PDF (RNF2) | Escalabilidad y orden | 🟡 Medio |
| **RNF-N3** | **Singleton Connection Pool** — ✅ COMPLETADO 2026-09-16 | PDF (RNF7) | Evita saturación BD | 🟢 Bajo |
| **RNF-N4** | **Mobile-First Responsive** | PDF (RNF3, RNF14) | 80%+ tráfico móvil en fitness | 🟡 Medio |

### 🟠 Importantes - Calidad y Operación
| ID | Requerimiento | Fuente | Justificación | Esfuerzo |
|----|---------------|--------|---------------|----------|
| **RNF-N5** | **Logger estructurado** (errores, auditoría) | PDF (RNF15) | Trazabilidad, debugging | 🟢 Bajo |
| **RNF-N6** | **Rate Limiting** API (anti-brute force) | PDF (RNF5) + Seguridad | Protección login | 🟢 Bajo |
| **RNF-N7** | **Backup automático BD** | Recomendación | Continuidad del negocio | 🟢 Bajo |
| **RNF-N8** | **Documentación técnica** (PHPDoc, README, API docs) | PDF (RNF6) | Onboarding, mantenimiento | 🟡 Medio |

### 🔵 Deseables - Madurez del Producto
| ID | Requerimiento | Fuente | Justificación | Esfuerzo |
|----|---------------|--------|---------------|----------|
| **RNF-N9** | **Versionamiento Git + GitHub** | PDF (RNF11) | Control de cambios, CI/CD | 🟢 Bajo |
| **RNF-N10** | **Pruebas unitarias** (PHPUnit, pytest) | PDF (RNF13) | Calidad, regresiones | 🟡 Medio |
| **RNF-N11** | **CI/CD + Despliegue nube** (Render/Heroku/Docker) | PDF (RNF12) | Entrega continua | 🔴 Alto |
| **RNF-N12** | **Internacionalización (i18n)** | Recomendación | Escalabilidad global | 🟡 Medio |
| **RNF-N13** | **Accesibilidad WCAG 2.1 AA** | Recomendación | Inclusión, legal | 🟡 Medio |

---

## 3. MATRIZ DE PRIORIZACIÓN (Impacto vs Esfuerzo)

```
ALTO IMPACTO / BAJO ESFUERZO  →  QUICK WINS (Hacer YA)
├── RNF-N3  Singleton Connection Pool
├── RNF-N5  Logger estructurado
├── RNF-N6  Rate Limiting API
├── RNF-N7  Backup automático BD
├── RF-N4   Objetivos del cliente
└── RF-N8   Control de hidratación

ALTO IMPACTO / ALTO ESFUERZO  →  PROYECTOS ESTRATÉGICOS
├── RF-N5   Generación IA de rutinas (Diferenciador)
├── RF-N1   Recuperación contraseña (Seguridad)
├── RF-N2   Datos antropométricos (Base IA)
├── RF-N3   Catálogo ejercicios (UX Core)
├── RNF-N1  Patrón DAO (Arquitectura)
├── RNF-N2  Arquitectura en capas
└── RNF-N4  Mobile-First

BAJO IMPACTO / BAJO ESFUERZO  →  RELLENO
├── RNF-N7  Backup BD
├── RF-N13  Exportar datos
└── RNF-N9  Versionamiento Git

BAJO IMPACTO / ALTO ESFUERZO  →  EVITAR / DIFERIR
├── RF-N11  Panel admin
├── RF-N10  Panel instructor
├── RNF-N11 CI/CD Nube
└── RNF-N13 Accesibilidad WCAG
```

---

## 4. ROADMAP DE IMPLEMENTACIÓN (3 FASES)

### 🚀 FASE 1 - Fundación Sólida (Semanas 1-2)
**Objetivo:** Cumplir requisitos PDF básicos + seguridad + arquitectura

| Sprint | Entregables | Criterios de Aceptación |
|--------|-------------|--------------------------|
| **1.1** | RNF-N3, RNF-N5, RNF-N6, RNF-N7 | ✅ Pool conexiones, ✅ Logs JSON, ✅ Rate limit 10 req/min login, ✅ Backup diario 03:00 |
| **1.2** | RNF-N1, RNF-N3 (DAO + Capas) | ✅ Clases DAO (UsuarioDAO, EjercicioDAO, SesionDAO), ✅ Separación Capa Negocio / Datos |
| **1.3** | RF-N1, RF-N4 | ✅ Recuperación email/token 1h, ✅ Campo objetivos en perfil (enum: fuerza/hipertrofia/mantenimiento) |

### 🏗️ FASE 2 - Core Diferenciador (Semanas 3-5)
**Objetivo:** Funcionalidades que diferencian el producto

| Sprint | Entregables | Criterios de Aceptación |
|--------|-------------|--------------------------|
| **2.1** | RF-N2, RF-N4 | ✅ Formulario antropometría (peso, estatura, %grasa, edad), ✅ Selector objetivo en onboarding |
| **2.2** | RF-N3 (Catálogo) | ✅ 50+ ejercicios pre-cargados (nombre, grupo muscular, video YouTube ID), ✅ Buscador + filtros (grupo, equipo, dificultad) |
| **2.3** | RF-N5 (IA Rutinas) | ✅ Endpoint `/ia/generar-rutina` recibe {dias, objetivo, nivel, equipamiento} → devuelve rutina estructurada 4-6 semanas |

### 🎨 FASE 3 - Experiencia Premium (Semanas 6-8)
**Objetivo:** Retención, engagement, pulido

| Sprint | Entregables | Criterios de Aceptación |
|--------|-------------|--------------------------|
| **3.1** | RF-N6, RF-N8 | ✅ Modal video YouTube en detalle ejercicio, ✅ Alertas hidratación cada 30 min durante sesión (configurable) |
| **3.2** | RF-N7, RF-N9 | ✅ 5 planes predefinidos (Fuerza 5x5, Hipertrofia PPL, Full Body 3d, Principiante, Solo mancuernas), ✅ CRUD plantillas usuario |
| **3.3** | RNF-N4, RNF-N8 | ✅ CSS Mobile-First (breakpoints 480/768/1024), ✅ PHPDoc completo, Swagger/OpenAPI para API |

### 🔧 FASE 4 - Madurez Operativa (Continuo)
| Área | Acciones |
|------|----------|
| **RNF-N9** | Init Git repo, branching strategy (GitFlow), GitHub repo privado |
| **RNF-N10** | PHPUnit (cobertura >70% en DAO/Services), pytest para Python IA |
| **RNF-N11** | Dockerfile + docker-compose, deploy Render/Railway gratis |
| **RNF-N12/13** | i18n (es/en), auditoría WCAG 2.1 AA |

---

## 5. DECISIONES TÉCNICAS CLAVE

| Decisión | Opción Elegida | Razón |
|----------|----------------|-------|
| **Patrón DAO** | Una clase por entidad (Auth, Usuario, Plantilla, Sesión, Ejercicio) | Simplicidad + testabilidad |
| **IA Rutinas** | Motor reglas + LLM ligero (Ollama/local) | Sin costos API, privacidad, offline |
| **Catálogo ejercicios** | JSON estático + tabla BD `ejercicios_catalogo` | Carga rápida, editable sin código |
| **Mobile-First** | CSS Grid + variables CSS + `@media (max-width: 768px)` | Sin frameworks, 0 dependencias |
| **Auth** | JWT stateless + refresh token 7d | Escalable, stateless |
| **Rate Limit** | Token bucket en Redis (o SQLite si no hay Redis) | Simple, efectivo |

---

## 6. MÉTRICAS DE ÉXITO

| KPI | Target Fase 1 | Target Fase 2 | Target Fase 3 |
|-----|---------------|---------------|---------------|
| **Cobertura tests** | >50% | >70% | >80% |
| **Tiempo carga móvil** | <3s | <2s | <1.5s |
| **Errores 5xx/semana** | <5 | <2 | 0 |
| **Usuarios con objetivo seteado** | 20% | 60% | 90% |
| **Rutinas generadas por IA/semana** | 0 | 50 | 200 |
| **Rachas >7 días** | 10% | 30% | 50% |

---

## 7. PRÓXIMOS PASOS INMEDIATOS

1. **Hecho (16/09)**: Refactor a capa DAO completo (RNF-N1/N2/N3) — 6 clases DAO, Singleton, 31 pruebas e2e PASS
2. **Siguiente**: Panel de recomendaciones IA ya conectado; revisar cobertura de pruebas (RNF-N10) y probar UI en navegador
3. **Pendiente**: Mobile-First responsivo (RNF-N4), logger estructurado (RNF-N5), backups (RNF-N7), Git/GitHub (RNF-N9)

---

*Documento vivo - actualizar al final de cada sprint*