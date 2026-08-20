"""
Motor de probabilidad de credito — Colsubsidio / Woop.

Calcula, para un perfil de colaborador, un score 0-100 (determinista, sin IA)
de que tan buen candidato es para cada una de las 8 lineas reales de credito
descritas en `UI_UX System for Woop (1)/src/imports/credito.md` (sintesis de
contenido real rastreado de colsubsidio.com/creditos).

No usa dependencias externas (solo stdlib) para poder desplegarse como funcion
serverless de Python en Vercel sin necesitar requirements.txt, y para poder
correr localmente con cualquier Python 3.10+ sin instalar nada:

    python api/probabilidad.py                       # corre con un perfil de ejemplo
    echo '{"edad": 30, ...}' | python api/probabilidad.py   # perfil por stdin

En Vercel, este archivo se despliega como una funcion aparte de las rutas de
Next.js (convencion oficial: archivos .py bajo /api con una clase `handler`
que extiende BaseHTTPRequestHandler). El frontend le pega por fetch a
`/api/probabilidad`.
"""

import json
import math
import re
from http.server import BaseHTTPRequestHandler

# Salario Minimo Mensual Legal Vigente (COP), 2026.
SMMLV = 1_750_905

PRODUCTS = [
    "libreInversion",
    "hipotecario",
    "mejoraVivienda",
    "educativo",
    "mujeres",
    "compraCartera",
    "mipymes",
    "cupoRotativo",
]

# Tasas reales publicadas para Credito Mujeres (unica linea con tasas publicas
# explicitas en credito.md), por categoria de afiliacion y modalidad.
TASAS_MUJERES = {
    "no_libranza": {"A": 20.79, "B": 21.91, "C": 23.03},
    "libranza": {"A": 18.30, "B": 19.20, "C": 20.10},
}

# Palabras clave detectadas en la bio real de redes sociales (EnsembleData +
# SocialCrawl) que suman puntos de contexto a cada producto — p.ej. una bio
# que dice "mama, repostera, emprendedora" suma senal real a Linea Mujer y
# MiPymes, mas alla de lo que ya dicen los campos duros del perfil (RRHH).
# Bilingue (es/en) a proposito: las bios reales vienen en cualquier idioma —
# caso real "THE HAIR WIZARD @trio_salon_and_boutique" no matcheaba nada sin
# ingles, aunque es claramente un negocio de peluqueria (senal de MiPymes).
KEYWORD_SIGNALS = {
    "mujeres": [
        "mama", "madre", "mujer", "emprendedora", "cabeza de familia", "mompreneur",
        "esposa", "hija", "abuela", "tia", "girlboss", "soymama",
        "mom", "mother", "wife", "single mom", "girlmom",
    ],
    "mipymes": [
        "emprendedora", "emprendedor", "emprendimiento", "negocio", "tienda", "marca",
        "ventas", "repostera", "reposteria", "manualidades", "boutique", "catalogo",
        "pyme", "freelance", "independiente", "disenadora", "diseno", "artesanias",
        "joyeria", "panaderia", "peluqueria", "salon de belleza", "maquillaje", "unas", "coach",
        "entrepreneur", "small business", "my business", "business owner", "shop owner",
        "boutique owner", "salon", "hair salon", "hairstylist", "hairdresser", "hair",
        "barber", "barbershop", "beauty", "makeup artist", "nail tech", "esthetician",
        "handmade", "custom orders", "dm to order", "shop now", "self employed", "small biz",
    ],
    "educativo": [
        "estudiante", "universidad", "universitari", "curso", "maestria", "posgrado",
        "colegio", "profesora", "profesor", "docente", "tesis", "semestre", "beca",
        "student", "university", "college", "graduate", "teacher", "professor", "masters degree",
    ],
    "hipotecario": [
        "casa propia", "hogar", "remodelacion", "vivienda", "apartamento",
        "finca raiz", "nueva casa", "mi casa", "propietaria", "propietario",
        "homeowner", "new home", "real estate", "dream home",
    ],
    "mejoraVivienda": [
        "remodelacion", "decoracion", "diy hogar", "renovacion", "interiorismo", "jardin",
        "home decor", "renovation", "interior design", "garden",
    ],
    "libreInversion": [
        "viajes", "viajera", "viajero", "fitness", "gym", "entrenamiento", "moda",
        "aventura", "explorar", "turismo", "running", "runner", "crossfit", "yoga", "wellness",
        "travel", "traveler", "wanderlust", "adventure", "explorer", "fashion", "personal trainer",
    ],
    "compraCartera": [
        "deudas", "consolidar", "cuotas atrasadas", "presupuesto", "ahorro", "finanzas personales",
        "debt", "budget", "savings", "financial freedom",
    ],
    "cupoRotativo": ["compras", "shopping", "tarjeta", "ofertas", "promo", "descuentos", "sale", "deals", "discount"],
}

BONUS_POR_KEYWORD = 12

# Tasa efectiva anual de referencia, solo para estimar cuanto podria financiar
# realmente un colaborador (no es la tasa real de ninguna linea especifica).
TASA_ANUAL_REFERENCIA = 0.18


def _clamp(value, lo=0, hi=100):
    return max(lo, min(hi, value))


def _normalizar(texto: str) -> str:
    # "_" y "." cuentan como caracter de palabra para \b — sin esto, un handle
    # como "@trio_salon_and_boutique" nunca deja matchear "salon"/"boutique".
    sin_separadores = texto.replace("_", " ").replace(".", " ")
    return sin_separadores.lower().translate(str.maketrans("áéíóúñ", "aeioun"))


def detectar_keywords(bios: list) -> dict:
    """Escanea las bios reales de redes sociales y devuelve, por producto,
    que palabras clave matchearon (lista vacia si ninguna). Usa limite de
    palabra al inicio (\\b) para evitar falsos positivos como "moda" adentro
    de "incomoda", pero sin \\b al final para permitir stems como
    "universitari" -> matchea "universitario"/"universitaria"."""
    texto = _normalizar(" ".join(b for b in bios if b))
    if not texto:
        return {}
    encontrados = {}
    for producto, palabras in KEYWORD_SIGNALS.items():
        matches = [p for p in palabras if re.search(r"\b" + re.escape(p), texto)]
        if matches:
            encontrados[producto] = matches
    return encontrados


def monto_maximo_financiable(salario: int, plazo_meses: int, tasa_anual: float = TASA_ANUAL_REFERENCIA) -> float:
    """Monto maximo que la cuota recomendada (30% del salario) alcanza a pagar en
    `plazo_meses`, usando la formula estandar de valor presente de una anualidad
    (amortizacion frances) — la inversa exacta del calculo de cuota mensual que usa
    scripts/seed.ts para generar simulaciones de ejemplo."""
    if plazo_meses <= 0 or salario <= 0:
        return 0.0
    cuota_maxima = salario * 0.3
    tasa_mensual = tasa_anual / 12
    factor = (1 + tasa_mensual) ** plazo_meses
    return cuota_maxima * (factor - 1) / (tasa_mensual * factor)


def calcular_acierto(scores: dict, monto_solicitado, plazo_meses, producto_interes, salario):
    """Compara la prediccion del motor (vector de 8 scores 0-100) contra la
    necesidad que el colaborador declaro por su cuenta en Woop (producto, monto,
    plazo), combinando dos senales:

    1. Similitud coseno entre el vector de scores y el vector "one-hot" del
       producto declarado — la misma tecnica que usan los sistemas de
       recomendacion para medir que tan bien un vector de preferencias
       predichas apunta a un item puntual (1.0 si ese producto domina el
       vector predicho, se acerca a 0 si el motor lo veia como improbable).
    2. Ajuste de monto: que tan cerca esta lo que el colaborador pidio del
       monto maximo financiable con su salario a ese plazo (formula real de
       amortizacion, ver `monto_maximo_financiable`).

    Se pondera 60% similitud de producto / 40% ajuste de monto. Devuelve None
    si no hay suficiente informacion declarada para comparar (colaborador sin
    registro en Woop).
    """
    if not producto_interes or producto_interes not in scores or not monto_solicitado or not plazo_meses:
        return None

    vector = [scores.get(p, 0) for p in PRODUCTS]
    norma = math.sqrt(sum(v * v for v in vector))
    similitud_producto = (scores[producto_interes] / norma) if norma > 0 else 0.0

    monto_max = monto_maximo_financiable(salario, plazo_meses)
    ajuste_monto = 1 - min(1.0, abs(monto_solicitado - monto_max) / max(monto_solicitado, monto_max, 1))

    porcentaje = _clamp(round(100 * (0.6 * similitud_producto + 0.4 * ajuste_monto)))

    return {
        "porcentajeAcierto": porcentaje,
        "similitudProducto": round(similitud_producto * 100),
        "ajusteMonto": round(ajuste_monto * 100),
        "montoMaximoFinanciable": round(monto_max),
    }


def calcular_probabilidades(perfil: dict) -> dict:
    """Recibe un perfil de colaborador (dict) y devuelve scores 0-100 por producto.

    Campos esperados (todos opcionales, con defaults razonables): edad, antiguedad
    (anios), salario, hijos, genero ("F"/"M"/"X"), categoriaAfiliacion ("A"/"B"/"C"),
    tipoVinculacion ("asalariado"/"pensionado"/"independiente"), libranza (bool),
    tieneCreditoVivienda (bool), tieneTarjetaColsubsidio (bool).
    """
    edad = perfil.get("edad", 30)
    antiguedad = perfil.get("antiguedad", 1)
    salario = perfil.get("salario", SMMLV)
    hijos = perfil.get("hijos", 0)
    genero = str(perfil.get("genero", "M")).upper()
    categoria = str(perfil.get("categoriaAfiliacion", "B")).upper()
    vinculacion = str(perfil.get("tipoVinculacion", "asalariado")).lower()
    libranza = bool(perfil.get("libranza", False))
    tiene_vivienda = bool(perfil.get("tieneCreditoVivienda", False))
    tiene_tarjeta = bool(perfil.get("tieneTarjetaColsubsidio", True))

    scores = {}

    # 1. Credito de libre inversion — "todas las categorias de afiliacion;
    #    disponible incluso sin vida crediticia". Elegibilidad amplia por diseno.
    s = 65
    if libranza:
        s += 15
    if salario >= 2 * SMMLV:
        s += 10
    if antiguedad >= 1:
        s += 10
    scores["libreInversion"] = _clamp(s)

    # 2. Credito Hipotecario — "Afiliados categorias A y B" unicamente.
    if categoria in ("A", "B"):
        s = 45
        if edad >= 28 and edad <= 55:
            s += 15
        if antiguedad >= 3:
            s += 15
        if salario >= 3 * SMMLV:
            s += 20
        if vinculacion == "pensionado":
            s += 5
    else:
        s = 5  # categoria C no califica segun el requisito publicado
    scores["hipotecario"] = _clamp(s)

    # 3. Mejora de vivienda — requiere credito hipotecario Colsubsidio YA aprobado.
    scores["mejoraVivienda"] = _clamp(80 + (10 if antiguedad >= 2 else 0)) if tiene_vivienda else 3

    # 4. Credito Educativo — abierto a estudiantes de cualquier nivel; perfil
    #    junior o con hijos en edad escolar/universitaria son mas propensos.
    s = 40
    if edad <= 30:
        s += 20
    elif edad <= 40:
        s += 10
    if antiguedad < 3:
        s += 10
    if hijos >= 1:
        s += 15
    if categoria in ("A", "B"):
        s += 10
    scores["educativo"] = _clamp(s)

    # 5. Credito Mujeres — linea exclusiva. Requisitos reales: mujer, 18-69 anios,
    #    ingresos > 1 SMMLV, sin reportes negativos (no modelado), afiliada activa.
    #    Antiguedad minima real es en MESES (2-6 segun vinculacion); como el dato
    #    del perfil esta en anios, cualquier antiguedad >= 1 anio la satisface.
    if genero == "F" and 18 <= edad <= 69 and salario > SMMLV and antiguedad >= 1:
        s = 70
        if hijos >= 1:
            s += 10
        if vinculacion == "asalariado":
            s += 10
        if libranza:
            s += 10
        scores["mujeres"] = _clamp(s)
    else:
        scores["mujeres"] = 2 if genero == "F" else 0

    # 6. Compra de cartera — consolidacion de deudas; mas relevante para perfiles
    #    con mas antiguedad/edad (mas probabilidad de tener deudas en el mercado).
    s = 35
    if edad >= 30:
        s += 15
    if antiguedad >= 2:
        s += 15
    if salario >= 2 * SMMLV:
        s += 10
    scores["compraCartera"] = _clamp(s)

    # 7. Credito MiPymes — "empresa afiliada a Colsubsidio"; sin un flag real de
    #    "dueno de empresa" en el modelo, se usa tipoVinculacion=independiente
    #    como la mejor aproximacion disponible.
    scores["mipymes"] = _clamp(55 + (20 if antiguedad >= 1 else 0)) if vinculacion == "independiente" else 8

    # 8. Cupo de credito (rotativo) — requiere Tarjeta Colsubsidio.
    scores["cupoRotativo"] = _clamp(75 + (10 if antiguedad >= 1 else 0)) if tiene_tarjeta else 5

    # Senal real de redes sociales: si en la bio aparecen palabras clave
    # relevantes (ej. "mama", "repostera", "emprendedora"), se suman puntos
    # al/los producto(s) relacionados. No reemplaza los campos duros del
    # perfil, los complementa con contexto real encontrado en redes.
    bios = perfil.get("bios", [])
    keyword_matches = detectar_keywords(bios) if bios else {}
    for producto, palabras in keyword_matches.items():
        if producto in scores:
            scores[producto] = _clamp(scores[producto] + BONUS_POR_KEYWORD * min(len(palabras), 2))

    top_product = max(scores, key=lambda k: scores[k])

    result = {**scores, "topProduct": top_product}
    if keyword_matches:
        result["keywordMatches"] = keyword_matches

    if genero == "F":
        modalidad = "libranza" if libranza else "no_libranza"
        tabla = TASAS_MUJERES[modalidad]
        result["tasaMujeresEA"] = tabla.get(categoria, tabla["B"])

    # Si el colaborador dejo una pre-simulacion declarada en Woop (monto, plazo,
    # producto de interes), se compara contra lo que predijo el motor.
    acierto = calcular_acierto(
        scores,
        perfil.get("montoSolicitado"),
        perfil.get("plazoMeses"),
        perfil.get("productoInteres"),
        salario,
    )
    if acierto:
        result["acierto"] = acierto

    return result


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            perfil = json.loads(raw or b"{}")
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Body invalido, se espera JSON"})
            return

        try:
            result = calcular_probabilidades(perfil)
        except Exception as err:  # noqa: BLE001 — devolver el error al cliente
            self._send_json(500, {"error": str(err)})
            return

        self._send_json(200, result)

    def do_GET(self):
        self._send_json(
            200,
            {
                "info": "POST un perfil de colaborador (JSON) para calcular probabilidades",
                "productos": PRODUCTS,
            },
        )


if __name__ == "__main__":
    import sys

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    if not sys.stdin.isatty():
        # En Windows, stdin en modo texto decodifica con el codepage del sistema
        # (no UTF-8) por defecto, lo que corrompe tildes/eñes al leer bios reales
        # de redes sociales. Se fuerza UTF-8 explicitamente para correr igual en
        # cualquier SO (el endpoint HTTP real ya es seguro: lee bytes crudos y
        # json.loads detecta la codificacion por su cuenta).
        try:
            sys.stdin.reconfigure(encoding="utf-8")
        except AttributeError:
            pass  # Python <3.7, no debería ocurrir con los runtimes que usamos
        entrada = sys.stdin.read().strip()
        perfil_prueba = json.loads(entrada) if entrada else {}
    else:
        perfil_prueba = {
            "edad": 29,
            "antiguedad": 2,
            "salario": 3_200_000,
            "hijos": 1,
            "genero": "F",
            "categoriaAfiliacion": "A",
            "tipoVinculacion": "asalariado",
            "libranza": True,
            "tieneCreditoVivienda": False,
            "tieneTarjetaColsubsidio": True,
        }
        print("(sin stdin — usando perfil de ejemplo)", file=sys.stderr)

    print(json.dumps(calcular_probabilidades(perfil_prueba), indent=2, ensure_ascii=False))
