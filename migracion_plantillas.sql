-- =============================================
-- MIGRACIÓN: Nuevo sistema de plantillas
-- =============================================

-- 1. Columnas nuevas en usuarios (cuestionario + niveles)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS edad INT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS altura DECIMAL(5,2);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS genero VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS objetivo VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_experiencia VARCHAR(20) DEFAULT 'principiante';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dias_semana INT DEFAULT 3;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cuestionario_completado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_progresion_on BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel INT DEFAULT 1;

-- 2. Catálogo de ejercicios (100 ejercicios con foto)
CREATE TABLE IF NOT EXISTS ejercicios_catalogo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    grupo_muscular VARCHAR(50) NOT NULL,
    subgrupo VARCHAR(50),
    equipo VARCHAR(50),
    dificultad VARCHAR(20) DEFAULT 'intermedio',
    foto_url TEXT
);

-- 3. Plantillas de entrenamiento
CREATE TABLE IF NOT EXISTS plantillas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50),
    nivel VARCHAR(20),
    es_sistema BOOLEAN DEFAULT FALSE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    generada_ia BOOLEAN DEFAULT FALSE,
    dias_por_semana INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Ejercicios dentro de cada plantilla
CREATE TABLE IF NOT EXISTS plantilla_ejercicios (
    id SERIAL PRIMARY KEY,
    plantilla_id INT REFERENCES plantillas(id) ON DELETE CASCADE,
    ejercicio_catalogo_id INT REFERENCES ejercicios_catalogo(id),
    nombre_manual VARCHAR(150),
    series INT DEFAULT 3,
    reps VARCHAR(20) DEFAULT '10',
    peso_base DECIMAL(5,2) DEFAULT 0,
    orden INT DEFAULT 0,
    descanso_segundos INT DEFAULT 90
);

-- 5. Sesiones de entrenamiento del usuario
CREATE TABLE IF NOT EXISTS sesiones_entrenamiento (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    plantilla_id INT REFERENCES plantillas(id),
    fecha_inicio TIMESTAMP DEFAULT NOW(),
    fecha_fin TIMESTAMP,
    completada BOOLEAN DEFAULT FALSE,
    xp_ganado INT DEFAULT 0,
    nivel_previo INT,
    nivel_nuevo INT
);

-- 6. Registro de ejercicios dentro de una sesión
CREATE TABLE IF NOT EXISTS sesion_ejercicios (
    id SERIAL PRIMARY KEY,
    sesion_id INT REFERENCES sesiones_entrenamiento(id) ON DELETE CASCADE,
    plantilla_ejercicio_id INT REFERENCES plantilla_ejercicios(id),
    ejercicio_catalogo_id INT REFERENCES ejercicios_catalogo(id),
    peso_usado DECIMAL(5,2),
    series_completadas INT DEFAULT 0,
    reps_completadas VARCHAR(50),
    completado BOOLEAN DEFAULT FALSE,
    descanso_activo BOOLEAN DEFAULT FALSE,
    momento_inicio TIMESTAMP DEFAULT NOW()
);

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_plantillas_usuario ON plantillas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_plantilla_ejercicios_plantilla ON plantilla_ejercicios(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_entrenamiento(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesion_ejercicios_sesion ON sesion_ejercicios(sesion_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_grupo ON ejercicios_catalogo(grupo_muscular);
