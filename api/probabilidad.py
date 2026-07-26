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
from http.server import BaseHTTPRequestHandler

# Salario Minimo Mensual Legal Vigente aproximado (COP) — solo para la demo.
SMMLV = 1_650_000

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


def _clamp(value, lo=0, hi=100):
    return max(lo, min(hi, value))


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

    top_product = max(scores, key=lambda k: scores[k])

    result = {**scores, "topProduct": top_product}

    if genero == "F":
        modalidad = "libranza" if libranza else "no_libranza"
        tabla = TASAS_MUJERES[modalidad]
        result["tasaMujeresEA"] = tabla.get(categoria, tabla["B"])

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

    if not sys.stdin.isatty():
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
