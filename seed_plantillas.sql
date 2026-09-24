-- =============================================
-- PLANTILLAS POR DEFECTO DEL SISTEMA
-- =============================================

-- ---- 1. Principiante Full Body (3 días) ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Full Body Principiante', 'Rutina completa 3 días a la semana para empezar con bases sólidas', 'gym_full', 'principiante', TRUE, 3);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '10', 0, 1, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Full Body Principiante' AND c.nombre='Sentadilla con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '10', 0, 2, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Full Body Principiante' AND c.nombre='Press de Banca con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '10', 0, 3, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Full Body Principiante' AND c.nombre='Remo con Mancuerna';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 2, '12', 0, 4, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Full Body Principiante' AND c.nombre='Elevaciones Laterales';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 2, '12', 0, 5, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Full Body Principiante' AND c.nombre='Curl con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '15', 0, 6, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Full Body Principiante' AND c.nombre='Plancha Frontal';

-- ---- 2. Fuerza Total (5x5) ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Fuerza Total 5x5', 'El clásico programa 5x5 para ganar fuerza bruta en los movimientos compuestos', 'fuerza', 'intermedio', TRUE, 3);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 5, '5', 60, 1, 180 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Fuerza Total 5x5' AND c.nombre='Sentadilla Trasera con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 5, '5', 40, 2, 180 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Fuerza Total 5x5' AND c.nombre='Press de Banca con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 5, '5', 60, 3, 180 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Fuerza Total 5x5' AND c.nombre='Peso Muerto Convencional';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '5', 30, 4, 150 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Fuerza Total 5x5' AND c.nombre='Press Militar con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '5', 40, 5, 150 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Fuerza Total 5x5' AND c.nombre='Remo con Barra';

-- ---- 3. Hipertrofia Pecho y Espalda ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Hipertrofia Push/Pull', 'Enfocado a ganar masa muscular en pecho, espalda y brazos', 'hipertrofia', 'intermedio', TRUE, 4);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '8', 50, 1, 120 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Push/Pull' AND c.nombre='Press de Banca con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '10', 45, 2, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Push/Pull' AND c.nombre='Press Inclinado con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 10, 3, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Push/Pull' AND c.nombre='Aperturas en Polea (Cruces)';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '8', 50, 4, 120 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Push/Pull' AND c.nombre='Dominadas con Agarre Prono';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '10', 30, 5, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Push/Pull' AND c.nombre='Jalón al Pecho (Pulldown)';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '10', 30, 6, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Push/Pull' AND c.nombre='Remo con Barra';

-- ---- 4. Hipertrofia Piernas ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Hipertrofia Piernas', 'Rutina brutal de pierna para cuádriceps, femoral y glúteos', 'hipertrofia', 'intermedio', TRUE, 2);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '8', 40, 1, 120 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Piernas' AND c.nombre='Sentadilla Trasera con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '10', 60, 2, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Piernas' AND c.nombre='Prensa de Piernas (Leg Press)';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '10', 30, 3, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Piernas' AND c.nombre='Peso Muerto Rumano';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 20, 4, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Piernas' AND c.nombre='Extensión de Cuádriceps';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 15, 5, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Piernas' AND c.nombre='Curl Femoral Acostado';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '15', 20, 6, 45 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Hipertrofia Piernas' AND c.nombre='Elevación de Gemelos de Pie';

-- ---- 5. Pérdida de Grasa Full Body ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Quema Grasa Total', 'Circuito de cuerpo completo con movimientos compuestos para quemar calorías', 'perdida_grasa', 'principiante', TRUE, 4);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 30, 1, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Quema Grasa Total' AND c.nombre='Sentadilla con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 30, 2, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Quema Grasa Total' AND c.nombre='Press de Banca con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 20, 3, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Quema Grasa Total' AND c.nombre='Remo con Mancuerna';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 20, 4, 45 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Quema Grasa Total' AND c.nombre='Press Militar con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '15', 0, 5, 45 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Quema Grasa Total' AND c.nombre='Crunch Abdominal';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '15', 0, 6, 45 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Quema Grasa Total' AND c.nombre='Plancha Frontal';

-- ---- 6. Estética Brazos ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Brazos y Hombros', 'Rutina de aislamiento para bíceps, tríceps y hombros definidos', 'hipertrofia', 'intermedio', TRUE, 2);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '10', 20, 1, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Brazos y Hombros' AND c.nombre='Curl de Bíceps con Barra Z';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '12', 12, 2, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Brazos y Hombros' AND c.nombre='Curl Martillo';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '10', 15, 3, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Brazos y Hombros' AND c.nombre='Extensión de Tríceps con Polea';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '10', 20, 4, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Brazos y Hombros' AND c.nombre='Press Francés con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '12', 8, 5, 45 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Brazos y Hombros' AND c.nombre='Elevaciones Laterales';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '10', 15, 6, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Brazos y Hombros' AND c.nombre='Press Militar con Mancuernas';

-- ---- 7. Avanzado Push/Pull/Legs ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Push Pull Legs Avanzado', 'División avanzada de 6 días para máximo crecimiento', 'hipertrofia', 'avanzado', TRUE, 6);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 5, '5', 70, 1, 150 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Push Pull Legs Avanzado' AND c.nombre='Press de Banca con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '8', 40, 2, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Push Pull Legs Avanzado' AND c.nombre='Press Militar con Barra';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '8', 50, 3, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Push Pull Legs Avanzado' AND c.nombre='Dominadas Supinas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '8', 50, 4, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Push Pull Legs Avanzado' AND c.nombre='Remo Pendlay';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 5, '5', 80, 5, 150 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Push Pull Legs Avanzado' AND c.nombre='Peso Muerto Convencional';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '10', 60, 6, 90 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Push Pull Legs Avanzado' AND c.nombre='Prensa de Piernas (Leg Press)';

-- ---- 8. Definición con Peso Libre ----
INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, dias_por_semana) VALUES
('Definición Peso Libre', 'Rutina de definición con altas repeticiones y peso libre', 'definicion', 'intermedio', TRUE, 4);

INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '12', 30, 1, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Definición Peso Libre' AND c.nombre='Sentadilla con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '12', 25, 2, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Definición Peso Libre' AND c.nombre='Press de Banca con Mancuernas';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '12', 25, 3, 60 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Definición Peso Libre' AND c.nombre='Jalón al Pecho (Pulldown)';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '15', 10, 4, 45 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Definición Peso Libre' AND c.nombre='Elevaciones Laterales';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 3, '15', 20, 5, 45 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Definición Peso Libre' AND c.nombre='Peso Muerto Rumano';
INSERT INTO plantilla_ejercicios (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
SELECT p.id, c.id, 4, '20', 0, 6, 30 FROM plantillas p, ejercicios_catalogo c
WHERE p.nombre='Definición Peso Libre' AND c.nombre='Plancha Frontal';