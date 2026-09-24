-- -------------------------------------------------
-- 1. TABLA: usuarios
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    nombre      VARCHAR(255) NOT NULL,
    creado_en   TIMESTAMP DEFAULT NOW()
);

-- -------------------------------------------------
-- 2. TABLA: sesiones
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL
);

-- -------------------------------------------------
-- 3. TABLA: ejercicios
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS ejercicios (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre      VARCHAR(100) NOT NULL,
    peso        DECIMAL(10,2) NOT NULL,
    series      INT NOT NULL,
    reps        INT NOT NULL,
    creado_en   TIMESTAMP DEFAULT NOW()
);

-- -------------------------------------------------
-- 4. TABLA: historial
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS historial (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ejercicio_id INT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    peso        DECIMAL(10,2) NOT NULL,
    series      INT NOT NULL,
    reps        INT NOT NULL,
    creado_en   TIMESTAMP DEFAULT NOW()
);

-- -------------------------------------------------
-- ÍNDICES (para velocidad de búsqueda)
-- -------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);
CREATE INDEX IF NOT EXISTS idx_ejerciciosadius ON ejercicios_altos;