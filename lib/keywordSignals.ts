// Espejo en TS de KEYWORD_SIGNALS en api/probabilidad.py. Se usa para mostrar las
// palabras clave detectadas en redes sociales directamente en la ficha del
// colaborador (sin esperar a que el asesor apriete "Recalcular"). El calculo real
// de puntos que usan esas keywords para ajustar la probabilidad de cada producto
// sigue viviendo unicamente en Python — esto es solo para mostrarlas en pantalla.
export { PRODUCT_LABELS } from "@/lib/creditProducts";

const KEYWORD_SIGNALS: Record<string, string[]> = {
  mujeres: [
    "mama", "madre", "mujer", "emprendedora", "cabeza de familia", "mompreneur",
    "esposa", "hija", "abuela", "tia", "girlboss", "soymama",
  ],
  mipymes: [
    "emprendedora", "emprendedor", "emprendimiento", "negocio", "tienda", "marca",
    "ventas", "repostera", "reposteria", "manualidades", "boutique", "catalogo",
    "pyme", "freelance", "independiente", "disenadora", "diseno", "artesanias",
    "joyeria", "panaderia", "peluqueria", "salon de belleza", "maquillaje", "unas", "coach",
  ],
  educativo: [
    "estudiante", "universidad", "universitari", "curso", "maestria", "posgrado",
    "colegio", "profesora", "profesor", "docente", "tesis", "semestre", "beca",
  ],
  hipotecario: [
    "casa propia", "hogar", "remodelacion", "vivienda", "apartamento",
    "finca raiz", "nueva casa", "mi casa", "propietaria", "propietario",
  ],
  mejoraVivienda: ["remodelacion", "decoracion", "diy hogar", "renovacion", "interiorismo", "jardin"],
  libreInversion: [
    "viajes", "viajera", "viajero", "fitness", "gym", "entrenamiento", "moda",
    "aventura", "explorar", "turismo", "running", "runner", "crossfit", "yoga", "wellness",
  ],
  compraCartera: ["deudas", "consolidar", "cuotas atrasadas", "presupuesto", "ahorro", "finanzas personales"],
  cupoRotativo: ["compras", "shopping", "tarjeta", "ofertas", "promo", "descuentos"],
};

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[áéíóú]/g, (c) => "aeiou"["áéíóú".indexOf(c)])
    .replace(/ñ/g, "n");
}

function escapeRegExp(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match por palabra/frase completa (con \b) en vez de substring simple, para
// evitar falsos positivos como "moda" adentro de "incomoda".
export function detectarKeywords(bios: (string | null | undefined)[]): Record<string, string[]> {
  const texto = normalizar(bios.filter(Boolean).join(" "));
  if (!texto) return {};
  const encontrados: Record<string, string[]> = {};
  for (const [producto, palabras] of Object.entries(KEYWORD_SIGNALS)) {
    const matches = palabras.filter((p) => new RegExp(`\\b${escapeRegExp(p)}`, "i").test(texto));
    if (matches.length > 0) encontrados[producto] = matches;
  }
  return encontrados;
}
