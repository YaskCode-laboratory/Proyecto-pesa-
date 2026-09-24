"""
Microservicio Python - Cálculos pesados de Pesas
================================================
Endpoints para análisis avanzado de entrenamientos que serían costosos
en PHP: progresión lineal, distribución de intensidad, proyecciones,
recomendaciones basadas en historial, etc.
"""
from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from collections import defaultdict
import os
import sys
import json
import urllib.request
import urllib.parse

app = Flask(__name__)

DATE_FORMAT = '%Y-%m-%d'

# Modelo de IA a usar con Gemini (free tier de Google AI Studio)
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama3.2')
OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://127.0.0.1:11434')
GEMINI_KEY = os.environ.get('GEMINI_API_KEY', '')

# ============================================================
# CORS (permite que el frontend en Live Server llame al microservicio)
# ============================================================
@app.after_request
def agregar_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/ai', methods=['GET', 'POST', 'OPTIONS'])
def cors_de_marcado():
    if request.method == 'OPTIONS':
        return ('', 204)
    return jsonify({'ok': True})

# ============================================================
# Configuración de la base de datos
# ============================================================
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'dbname': 'pesas',
    'user': 'postgres',
    'password': 'REDACTED_CREDENTIAL'
}

def get_db():
    """Abre una conexión nueva (simple, sin pool)."""
    return psycopg2.connect(**DB_CONFIG)


def _sin_tildes(texto):
    """Normaliza acentos/ñ para comparar nombres sin importar la tilde."""
    import unicodedata
    if not texto:
        return texto
    sin_acento = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    return sin_acento.replace('ñ', 'n')


BITACORA_LOG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'actividad.log')


def escribir_bitacora(uid, accion, detalle=''):
    """Append de una línea al log de actividad de la página (actividad.log)."""
    try:
        with open(BITACORA_LOG, 'a', encoding='utf-8') as f:
            f.write('{} | U{} | | {} | {}\n'.format(
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'), uid, accion, str(detalle).replace('\n', ' ').replace('\r', ' ')
            ))
    except Exception:
        pass


def validar_token(token):
    """Valida token y devuelve usuario_id, o None si es inválido."""
    if not token:
        return None
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT usuario_id FROM sesiones WHERE token = %s AND expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()


def require_auth(f):
    """Decorador: rechaza la petición si el token es inválido."""
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            token = request.json.get('token') if request.is_json else None
        if not token:
            token = request.args.get('token')
        uid = validar_token(token)
        if not uid:
            return jsonify({'error': 'Token inválido o expirado'}), 401
        request.user_id = uid
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


# ============================================================
# ENDPOINTS DE SALUD
# ============================================================
@app.route('/')
def home():
    return jsonify({
        'servicio': 'Pesas - Microservicio de Análisis',
        'version': '1.0',
        'endpoints': [
            'GET  /health',
            'GET  /analisis/progreso?token=...',
            'GET  /analisis/distribucion?token=...',
            'GET  /analisis/proyeccion?token=...',
            'GET  /analisis/racha?token=...',
            'GET  /analisis/recomendaciones?token=...',
            'GET  /analisis/volumen_por_grupo?token=...',
            'POST /plantilla_ia (requiere token + perfil)',
            'GET  /recomendaciones_ia?token=...',
        ]
    })


@app.route('/health')
def health():
    try:
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        conn.close()
        return jsonify({'status': 'ok', 'db': 'ok', 'time': datetime.now().isoformat()})
    except Exception as e:
        return jsonify({'status': 'error', 'db': str(e)}), 500


# ============================================================
# 1. PROGRESO LINEAL (regresión del volumen a lo largo del tiempo)
# ============================================================
@app.route('/analisis/progreso')
@require_auth
def progreso():
    """Calcula la tendencia de volumen de los últimos 30 días."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    DATE(creado_en) AS fecha,
                    SUM(peso * series * reps) AS volumen,
                    COUNT(*) AS ejercicios
                FROM ejercicios
                WHERE usuario_id = %s
                  AND creado_en > NOW() - INTERVAL '30 days'
                GROUP BY DATE(creado_en)
                ORDER BY fecha
            """, (request.user_id,))
            dias = cur.fetchall()

        if len(dias) < 2:
            return jsonify({
                'success': True,
                'mensaje': 'Necesitas al menos 2 días con datos para ver progreso',
                'dias': [dict(d) for d in dias]
            })

        # Regresión lineal simple
        n = len(dias)
        xs = list(range(n))
        ys = [float(d['volumen']) for d in dias]
        x_mean = sum(xs) / n
        y_mean = sum(ys) / n
        num = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))
        den = sum((x - x_mean) ** 2 for x in xs) or 1
        pendiente = num / den
        intercepto = y_mean - pendiente * x_mean

        # Proyección 7 días
        proyeccion = intercepto + pendiente * (n + 7)
        r2 = (num ** 2) / (den * sum((y - y_mean) ** 2 for y in ys) or 1)

        return jsonify({
            'success': True,
            'dias': [dict(d) for d in dias],
            'tendencia': {
                'pendiente': round(pendiente, 2),
                'intercepto': round(intercepto, 2),
                'r_cuadrado': round(r2, 3),
                'interpretacion': 'subiendo 📈' if pendiente > 0 else 'bajando 📉' if pendiente < 0 else 'estable ➡️'
            },
            'proyeccion_7d': round(max(0, proyeccion), 2)
        })
    finally:
        conn.close()


# ============================================================
# 2. DISTRIBUCIÓN DE INTENSIDAD
# ============================================================
@app.route('/analisis/distribucion')
@require_auth
def distribucion():
    """Clasifica ejercicios por rango de peso (fuerza/hipertrofia/resistencia)."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    nombre,
                    peso,
                    series,
                    reps,
                    (peso * series * reps) AS volumen
                FROM ejercicios
                WHERE usuario_id = %s
                ORDER BY creado_en DESC
            """, (request.user_id,))
            rows = cur.fetchall()

        fuerza = sum(1 for r in rows if float(r['peso']) >= 50)
        hipertrofia = sum(1 for r in rows if 15 <= float(r['peso']) < 50)
        resistencia = sum(1 for r in rows if float(r['peso']) < 15)
        total = len(rows) or 1

        return jsonify({
            'success': True,
            'total': len(rows),
            'fuerza': {'cantidad': fuerza, 'porcentaje': round(fuerza / total * 100, 1)},
            'hipertrofia': {'cantidad': hipertrofia, 'porcentaje': round(hipertrofia / total * 100, 1)},
            'resistencia': {'cantidad': resistencia, 'porcentaje': round(resistencia / total * 100, 1)},
            'recomendacion': _recomendar_distribucion(fuerza, hipertrofia, resistencia, total)
        })
    finally:
        conn.close()


def _recomendar_distribucion(f, h, r, total):
    if total == 0:
        return 'Sin datos aún'
    pct_f = f / total * 100
    pct_h = h / total * 100
    if pct_f > 70:
        return '⚠️ Demasiado peso pesado. Riesgo de sobreentrenamiento. Añade más hipertrofia (15-50kg).'
    if pct_h < 30 and total > 5:
        return '💡 Considera más ejercicios de hipertrofia (rango 15-50kg) para equilibrio.'
    if pct_f == 0 and total > 3:
        return '💡 Prueba agregar ejercicios de fuerza pesada (>50kg) para desafiar tu cuerpo.'
    return '✅ Buena distribución de intensidades.'


# ============================================================
# 3. PROYECCIÓN DE VOLUMEN (cuánto levantarás en X días al ritmo actual)
# ============================================================
@app.route('/analisis/proyeccion')
@require_auth
def proyeccion():
    """Proyecta volumen futuro en base al ritmo actual."""
    dias = int(request.args.get('dias', 30))
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    COALESCE(AVG(vol_dia), 0) AS promedio_diario,
                    COALESCE(STDDEV(vol_dia), 0) AS desviacion,
                    COUNT(DISTINCT DATE(creado_en)) AS dias_activos,
                    MIN(DATE(creado_en)) AS primer_dia,
                    MAX(DATE(creado_en)) AS ultimo_dia
                FROM (
                    SELECT DATE(creado_en) AS dia, SUM(peso * series * reps) AS vol_dia
                    FROM ejercicios
                    WHERE usuario_id = %s
                      AND creado_en > NOW() - INTERVAL '90 days'
                    GROUP BY DATE(creado_en)
                ) sub
            """, (request.user_id,))
            stats = cur.fetchone()

        promedio = float(stats['promedio_diario'] or 0)
        proyeccion_total = promedio * dias
        variabilidad = float(stats['desviacion'] or 0)

        return jsonify({
            'success': True,
            'promedio_diario': round(promedio, 2),
            'desviacion': round(variabilidad, 2),
            'dias_proyectados': dias,
            'volumen_proyectado': round(proyeccion_total, 2),
            'rango_min': round(max(0, proyeccion_total - variabilidad * dias * 1.96), 2),
            'rango_max': round(proyeccion_total + variabilidad * dias * 1.96, 2),
            'dias_activos_historico': stats['dias_activos'],
            'consistencia': 'alta' if variabilidad < promedio * 0.3 else 'media' if variabilidad < promedio else 'baja'
        })
    finally:
        conn.close()


# ============================================================
# 4. RACHA DE DÍAS CONSECUTIVOS
# ============================================================
@app.route('/analisis/racha')
@require_auth
def racha():
    """Calcula la racha actual y la mejor racha de días consecutivos con ejercicio."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT DISTINCT DATE(creado_en) AS dia
                FROM ejercicios
                WHERE usuario_id = %s
                ORDER BY dia DESC
            """, (request.user_id,))
            dias = [d['dia'] for d in cur.fetchall()]

        if not dias:
            return jsonify({'success': True, 'racha_actual': 0, 'mejor_racha': 0, 'total_dias': 0})

        racha_actual = 1
        hoy = datetime.now().date()
        if dias[0] == hoy or dias[0] == hoy - timedelta(days=1):
            for i in range(1, len(dias)):
                if (dias[i - 1] - dias[i]).days == 1:
                    racha_actual += 1
                else:
                    break
        else:
            racha_actual = 0

        mejor_racha = 1
        racha_temp = 1
        for i in range(1, len(dias)):
            if (dias[i - 1] - dias[i]).days == 1:
                racha_temp += 1
                mejor_racha = max(mejor_racha, racha_temp)
            else:
                racha_temp = 1

        return jsonify({
            'success': True,
            'racha_actual': racha_actual,
            'mejor_racha': mejor_racha,
            'total_dias_unicos': len(dias),
            'ultimo_dia': str(dias[0]) if dias else None,
            'mensaje': f'🔥 ¡{racha_actual} días consecutivos!' if racha_actual >= 3 else 'Entrena hoy para mantener la racha'
        })
    finally:
        conn.close()


# ============================================================
# 5. RECOMENDACIONES DE PRÓXIMOS EJERCICIOS
# ============================================================
@app.route('/analisis/recomendaciones')
@require_auth
def recomendaciones():
    """Sugiere ejercicios basándose en los que más haces y detecta cuáles no haces."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT nombre, COUNT(*) AS veces, MAX(peso) AS peso_maximo
                FROM ejercicios
                WHERE usuario_id = %s
                GROUP BY nombre
                ORDER BY veces DESC
            """, (request.user_id,))
            ejercicios = cur.fetchall()

        populares = [dict(e) for e in ejercicios[:5]]
        sin_hacer = []

        # Detectar ejercicios básicos que el usuario no ha hecho
        basicos = ['Sentadilla', 'Press Banca', 'Peso Muerto', 'Press Militar', 'Remo', 'Dominadas', 'Curl Bíceps', 'Extensión Tríceps']
        nombres = {e['nombre'].lower() for e in ejercicios}
        for b in basicos:
            if b.lower() not in nombres:
                sin_hacer.append(b)

        # Detectar estancamiento (mismo peso máximo en 30 días)
        estancados = []
        for e in ejercicios:
            if e['veces'] < 3:
                continue
            cur.execute("""
                SELECT DISTINCT peso FROM ejercicios
                WHERE usuario_id = %s AND nombre = %s
                  AND creado_en > NOW() - INTERVAL '30 days'
                ORDER BY peso
            """, (request.user_id, e['nombre']))
            pesos = [r[0] for r in cur.fetchall()]
            if len(pesos) >= 3 and len(set(pesos)) == 1:
                estancados.append({'ejercicio': e['nombre'], 'peso_estancado': float(pesos[0]), 'dias': 30})

        return jsonify({
            'success': True,
            'mas_frecuentes': populares,
            'no_realizados': sin_hacer[:5],
            'estancados': estancados,
            'sugerencia': sin_hacer[0] if sin_hacer else 'Mantén la consistencia 💪'
        })
    finally:
        conn.close()


# ============================================================
# 6. VOLUMEN POR GRUPO MUSCULAR (heurística por nombre)
# ============================================================
MAPA_GRUPOS = {
    'pecho': ['press banca', 'press inclinado', 'aperturas', 'flexiones', 'cruce'],
    'espalda': ['remo', 'dominada', 'jalon', 'pullover', 'encogimiento'],
    'pierna': ['sentadilla', 'peso muerto', 'prensa', 'extension', 'curl femoral', 'zancada', 'hack'],
    'hombro': ['press militar', 'elevacion lateral', 'elevacion frontal', 'pajaro'],
    'brazo': ['curl biceps', 'extension triceps', 'martillo', 'fondos', 'press frances'],
    'core': ['plancha', 'crunch', 'abdominal', 'rueda', 'elevacion piernas']
}

@app.route('/analisis/volumen_por_grupo')
@require_auth
def volumen_por_grupo():
    """Agrupa el volumen por grupo muscular usando heurística de nombres."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT nombre, peso, series, reps, (peso * series * reps) AS volumen
                FROM ejercicios
                WHERE usuario_id = %s
            """, (request.user_id,))
            rows = cur.fetchall()

        grupos = defaultdict(lambda: {'volumen': 0, 'ejercicios': 0, 'nombres': set()})
        for r in rows:
            nombre_low = r['nombre'].lower()
            asignado = False
            for grupo, keywords in MAPA_GRUPOS.items():
                if any(k in nombre_low for k in keywords):
                    grupos[grupo]['volumen'] += float(r['volumen'])
                    grupos[grupo]['ejercicios'] += 1
                    grupos[grupo]['nombres'].add(r['nombre'])
                    asignado = True
                    break
            if not asignado:
                grupos['otros']['volumen'] += float(r['volumen'])
                grupos['otros']['ejercicios'] += 1
                grupos['otros']['nombres'].add(r['nombre'])

        resultado = []
        for g, data in grupos.items():
            resultado.append({
                'grupo': g,
                'volumen': round(data['volumen'], 2),
                'ejercicios': data['ejercicios'],
                'nombres': list(data['nombres'])
            })
        resultado.sort(key=lambda x: x['volumen'], reverse=True)

        return jsonify({
            'success': True,
            'por_grupo': resultado,
            'total': round(sum(g['volumen'] for g in resultado), 2)
        })
    finally:
        conn.close()


# ============================================================
# 7. PLANTILLA IA (genera plantilla personalizada desde el catálogo)
# ============================================================
OBJETIVO_LABEL = {
    'ganar_musculo': 'Hipertrofia',
    'fuerza': 'Fuerza',
    'perder_grasa': 'Quema Grasa',
    'definicion': 'Definición',
    'salud': 'Full Body Salud',
}

GRUPOS_POR_OBJETIVO = {
    'ganar_musculo': ['pecho', 'espalda', 'pierna', 'hombro', 'brazo', 'core'],
    'fuerza': ['pecho', 'espalda', 'pierna'],
    'perder_grasa': ['pierna', 'core', 'pecho', 'espalda', 'brazo'],
    'definicion': ['pecho', 'espalda', 'pierna', 'hombro', 'brazo', 'core'],
    'salud': ['pierna', 'pecho', 'espalda', 'core', 'brazo'],
}

RANGO_POR_OBJETIVO = {
    'ganar_musculo': (4, '8-10'),
    'fuerza': (5, '5'),
    'perder_grasa': (3, '15'),
    'definicion': (4, '12'),
    'salud': (3, '12'),
}

MULTIPLICADOR_PESO_GRUPO = {
    'pierna': 0.8, 'espalda': 0.7, 'pecho': 0.5,
    'hombro': 0.3, 'brazo': 0.2, 'core': 0.1, 'gluteo': 0.7,
}

# ============================================================
# MOTOR HÍBRIDO DE IA (Gemini gratis → Ollama local → heurística)
# ============================================================
def _peticion_http(url, payload, timeout=25):
    """POST JSON vía urllib (sin dependencias extra)."""
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def _gemini_con(texto, mime='application/json'):
    """Llama a Gemini (free tier de Google AI Studio). Devuelve texto o None."""
    if not GEMINI_KEY:
        return None
    url = 'https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}'.format(GEMINI_MODEL, GEMINI_KEY)
    payload = {
        'contents': [{'parts': [{'text': texto}]}],
        'generationConfig': {
            'responseMimeType': mime,
            'temperature': 0.4,
            'maxOutputTokens': 1024
        }
    }
    try:
        r = _peticion_http(url, payload)
        return r['candidates'][0]['content']['parts'][0]['text']
    except Exception:
        return None


def _ollama_con(prompt):
    """Llama a Ollama local (gratis y sin clave). Devuelve texto o None."""
    try:
        req = urllib.request.Request(
            OLLAMA_URL + '/api/generate',
            data=json.dumps({'model': OLLAMA_MODEL, 'prompt': prompt, 'stream': False}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=40) as resp:
            return json.loads(resp.read().decode('utf-8')).get('response')
    except Exception:
        return None


def _extraer_json(texto):
    """Extrae un JSON de la respuesta de la IA (tolera bloques markdown)."""
    if not texto:
        return None
    texto = texto.strip()
    if texto.startswith('```'):
        primera = texto.find('\n')
        ultima = texto.rfind('```')
        texto = texto[primera + 1:ultima].strip() if primera != -1 and ultima > primera else texto[3:-3].strip()
    try:
        return json.loads(texto)
    except Exception:
        inicio = texto.find('[') if '[' in texto else texto.find('{')
        fin = texto.rfind(']') if ']' in texto else texto.rfind('}')
        if inicio != -1 and fin != -1 and fin > inicio:
            try:
                return json.loads(texto[inicio:fin + 1])
            except Exception:
                return None
    return None


def _ia_elige_ejercicios(perfil, catalogo, catalogo_nombres):
    """Pide a la IA (Gemini u Ollama) que elija ejercicios del catálogo.

    Devuelve (plan_ia, motor) donde plan_ia es una lista de dicts o None,
    y motor es 'gemini' | 'ollama' | 'heuristica'.
    """
    objetivo = perfil.get('objetivo', 'ganar_musculo')
    nivel = perfil.get('nivel', 'intermedio')
    dias = int(perfil.get('dias_semana', 3))
    peso = float(perfil.get('peso', 70))

    instruccion = (
        'Eres un entrenador personal experto. De la siguiente lista de ejercicios disponibles, arma '
        'una rutina para un usuario con objetivo "{0}", nivel "{1}", que entrena {2} días/semana y pesa {3} kg. '
        'Responde SOLO JSON (sin markdown) con este formato exacto:\n'
        '[{{"ejercicio": "Nombre exacto del catálogo", "series": 4, "reps": "10", "peso": 40.0}}]\n'
        'Elige entre 4 y 6 ejercicios variando grupos musculares. El campo "peso" en kg debe ser '
        'apropiado para su nivel ("principiante"->ligero, "intermedio"->moderado, "avanzado"->pesado).\n\n'
        'LISTA DE EJERCICIOS DISPONIBLES:\n{4}'
    ).format(objetivo, nivel, dias, peso, ';\n'.join(catalogo_nombres))

    texto = _gemini_con(instruccion)
    motor = 'gemini'
    if not texto:
        texto = _ollama_con(instruccion)
        motor = 'ollama'
    if not texto:
        return None, 'heuristica'

    plan = _extraer_json(texto)
    if not isinstance(plan, list) or len(plan) < 3:
        return None, motor
    return plan, motor


def _recomendacion_heuristica(estructura):
    """Texto de consejo generado sin IA cuando no hay motor disponible."""
    racha = estructura['racha_actual']
    lineas = []
    if racha >= 3:
        lineas.append('¡Vas muy bien! Llevas una racha de {0} días entrenando, mantén la constancia.'.format(racha))
    elif racha == 0:
        lineas.append('No has registrado entrenamientos aún. Empieza hoy con calma y constancia.')
    else:
        lineas.append('Llevas una racha de {0} día(s). ¡No la cortes!'.format(racha))
    if estructura['no_realizados']:
        lineas.append('Te sugiero incorporar pronto: {0}.'.format(', '.join(estructura['no_realizados'][:3])))
    if estructura['estancados']:
        est = estructura['estancados'][0]
        lineas.append('Estás estancado en {0} (kg). Prueba reducir reps y subir 2.5 kg la próxima sesión.'.format(est['ejercicio']))
    lineas.append('Recuerda descansar 60-90s entre series e hidratarte en los puntos de descanso. 💪')
    return ' '.join(lineas)


@app.route('/plantilla_ia', methods=['POST'])
@require_auth
def plantilla_ia():
    """Crea una plantilla en la BD usando IA real (Gemini/Ollama) o catálogo + heurística."""
    data = request.get_json(silent=True) or {}
    objetivo = data.get('objetivo', 'ganar_musculo')
    nivel = data.get('nivel', 'intermedio')
    dias = int(data.get('dias_semana', 3))
    peso = float(data.get('peso', 70))

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT nivel, nivel_progresion_on FROM usuarios WHERE id = %s", (request.user_id,))
            usu = cur.fetchone()
            nivel_db = usu['nivel'] if usu else 1
            factor_nivel = 1 + (nivel_db - 1) * 0.05 if usu and usu['nivel_progresion_on'] else 1

            cur.execute("SELECT id, nombre, grupo_muscular FROM ejercicios_catalogo ORDER BY grupo_muscular, nombre")
            catalogo = cur.fetchall()
            nombres = [c['nombre'] for c in catalogo]

            # 1) Intentar IA real
            plan_ia, motor = _ia_elige_ejercicios(data, catalogo, nombres)
            ejercicios_plan = []
            if plan_ia:
                for item in plan_ia:
                    ej_nombre = str(item.get('ejercicio', '')).strip()
                    match = next((c for c in catalogo if c['nombre'].lower() == ej_nombre.lower()), None)
                    if not match:
                        match = next((c for c in catalogo if ej_nombre.lower() in c['nombre'].lower()), None)
                    if not match:
                        continue
                    try:
                        series_x = max(1, int(item.get('series', 3)))
                    except Exception:
                        series_x = 3
                    reps_x = str(item.get('reps', '10'))
                    try:
                        peso_base = round(float(item.get('peso', 0)), 1)
                    except Exception:
                        peso_base = 0.0
                    ejercicios_plan.append((match, peso_base, series_x, reps_x))

            # 2) Falla a heurística si la IA no respondió o no matcheó
            if not ejercicios_plan:
                motor = 'heuristica'
                series, reps = RANGO_POR_OBJETIVO.get(objetivo, RANGO_POR_OBJETIVO['ganar_musculo'])
                peso_mult = (0.9 if nivel == 'principiante' else 1.0 if nivel == 'intermedio' else 1.1)
                grupos = GRUPOS_POR_OBJETIVO.get(objetivo, GRUPOS_POR_OBJETIVO['ganar_musculo'])[:max(4, dias + 1)]
                for grupo in grupos:
                    elegido = next((c for c in catalogo if c['grupo_muscular'] == grupo), None)
                    if elegido:
                        peso_base = round(peso * MULTIPLICADOR_PESO_GRUPO.get(grupo, 0.4) * peso_mult * factor_nivel, 1)
                        ejercicios_plan.append((elegido, peso_base, series, reps))

            if not ejercicios_plan:
                return jsonify({'success': False, 'error': 'No hay ejercicios en el catálogo para tu perfil'}), 400

            etiqueta = OBJETIVO_LABEL.get(objetivo, 'Hipertrofia')
            nombre_plantilla = 'Plantilla IA ({0}) · {1}'.format(motor, etiqueta) if motor in ('gemini', 'ollama') else 'Plantilla IA · {0}'.format(etiqueta)
            descripcion = 'Generada por IA con motor "{0}" · objetivo {1} · nivel {2}'.format(motor, objetivo.replace('_', ' '), nivel)

            cur.execute("""
                INSERT INTO plantillas (nombre, descripcion, tipo, nivel, es_sistema, usuario_id, dias_por_semana)
                VALUES (%s, %s, %s, %s, FALSE, %s, %s)
                RETURNING id
            """, (nombre_plantilla, descripcion, objetivo, nivel, request.user_id, dias))
            plantilla_id = cur.fetchone()['id']

            for serie, (ej, peso_base, series_x, reps_x) in enumerate(ejercicios_plan, 1):
                cur.execute("""
                    INSERT INTO plantilla_ejercicios
                    (plantilla_id, ejercicio_catalogo_id, series, reps, peso_base, orden, descanso_segundos)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (plantilla_id, ej['id'], series_x, reps_x, peso_base, serie, 90))

            conn.commit()
            escribir_bitacora(request.user_id, 'GENERAR PLANTILLA IA',
                              'plantilla_id {0} · motor {1} · {2} ejercicios'.format(plantilla_id, motor, len(ejercicios_plan)))

        return jsonify({
            'success': True,
            'plantilla_id': plantilla_id,
            'motor_ia': motor,
            'ejercicios': [ej['nombre'] for ej, _, _, _ in ejercicios_plan],
            'pesos_sugeridos': round(sum(p for _, p, _, _ in ejercicios_plan), 1),
            'objetivo': objetivo,
            'nivel': nivel,
            'mensaje': 'Plantilla generada con motor "{0}" · {1} ejercicios'.format(motor, len(ejercicios_plan)),
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/recomendaciones_ia')
@require_auth
def recomendaciones_ia():
    """Consejo personalizado de la IA + datos estructurados (racha, pendientes, estancamiento)."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT objetivo, nivel_experiencia, dias_semana, peso, edad
                FROM usuarios WHERE id = %s
            """, (request.user_id,))
            perfil = cur.fetchone() or {}

            cur.execute("""
                SELECT nombre, COUNT(*) AS veces, MAX(peso) AS peso_maximo
                FROM ejercicios WHERE usuario_id = %s
                GROUP BY nombre ORDER BY veces DESC
            """, (request.user_id,))
            ejercicios = cur.fetchall()

            cur.execute("""
                SELECT DISTINCT DATE(creado_en) AS dia FROM ejercicios
                WHERE usuario_id = %s ORDER BY dia DESC
            """, (request.user_id,))
            dias = [d['dia'] for d in cur.fetchall()]

        # Racha
        racha_actual = 0
        mejor_racha = 0
        if dias:
            hoy = datetime.now().date()
            if dias[0] in (hoy, hoy - timedelta(days=1)):
                racha_actual = 1
                for i in range(1, len(dias)):
                    if (dias[i - 1] - dias[i]).days == 1:
                        racha_actual += 1
                    else:
                        break
            mejor_racha = 1
            temp = 1
            for i in range(1, len(dias)):
                if (dias[i - 1] - dias[i]).days == 1:
                    temp += 1
                    mejor_racha = max(mejor_racha, temp)
                else:
                    temp = 1

        populares = [dict(e) for e in ejercicios[:5]]
        basicos = ['Sentadilla', 'Press Banca', 'Peso Muerto', 'Press Militar', 'Remo', 'Dominadas', 'Curl Biceps', 'Extension Triceps']
        nombres = {_sin_tildes(e['nombre'].lower()) for e in ejercicios}
        no_realizados = [b for b in basicos if _sin_tildes(b.lower()) not in nombres][:5]

        estancados = []
        if ejercicios:
            with conn.cursor(cursor_factory=RealDictCursor) as cur2:
                for e in ejercicios:
                    if e['veces'] < 3:
                        continue
                    cur2.execute("""
                        SELECT DISTINCT peso FROM ejercicios
                        WHERE usuario_id = %s AND nombre = %s
                          AND creado_en > NOW() - INTERVAL '30 days'
                        ORDER BY peso
                    """, (request.user_id, e['nombre']))
                    pesos = [r['peso'] for r in cur2.fetchall()]
                    if len(pesos) >= 3 and len(set(pesos)) == 1:
                        estancados.append({'ejercicio': e['nombre'], 'peso': float(pesos[0])})
        estancados = estancados[:3]

        estructura = {
            'racha_actual': racha_actual,
            'mejor_racha': mejor_racha,
            'total_ejercicios_historial': len(ejercicios),
            'mas_frecuentes': [x['nombre'] for x in populares],
            'no_realizados': no_realizados,
            'estancados': estancados,
            'plantilla_recomendada': OBJETIVO_LABEL.get(perfil.get('objetivo'), 'Full Body Salud'),
        }

        # Consejo con IA real si está disponible
        estancados_txt = '; '.join('{0} en {1} kg'.format(s['ejercicio'], s['peso']) for s in estancados)
        resumen = (
            'Perfil: objetivo={0}, nivel={1}, {2} días/semana, {3} kg. '
            'Racha actual={4} días, mejor racha={5} días. '
            'Ejercicios frecuentes: {6}. '
            'No ha hecho: {7}. '
            'Estancamientos recientes: {8}.'
        ).format(
            perfil.get('objetivo'), perfil.get('nivel_experiencia'),
            perfil.get('dias_semana'), perfil.get('peso'),
            racha_actual, mejor_racha,
            ', '.join(x['nombre'] for x in populares[:4]) or 'ninguno',
            ', '.join(no_realizados) or 'ninguno',
            estancados_txt or 'ninguno'
        )
        prompt = (
            'Eres un entrenador personal en español. Dales a un usuario de una app de pesas '
            'una recomendación breve y motivadora (máximo 120 palabras) con acciones concretas. '
            'Datos del usuario:\n' + resumen
        )

        texto_ia = _gemini_con(prompt, mime='text/plain')
        motor = 'gemini'
        if not texto_ia:
            texto_ia = _ollama_con(prompt)
            motor = 'ollama'
        if not texto_ia:
            motor = 'heuristica'
            texto_ia = _recomendacion_heuristica(estructura)

        return jsonify({
            'success': True,
            'motor_ia': motor,
            'consejo_ia': texto_ia,
            'estructura': estructura
        })
    finally:
        conn.close()


# ============================================================
# MAIN
# ============================================================
if __name__ == '__main__':
    print("=" * 60)
    print("  PESAS - Microservicio de Análisis")
    print("=" * 60)
    print(f"  Conectando a PostgreSQL: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}")
    print(f"  Documentación: http://localhost:5001/")
    print("=" * 60)
    app.run(host='127.0.0.1', port=5001, debug=False)
