// Fuente unica de las 8 lineas de credito reales de Colsubsidio (ver
// api/probabilidad.py). Antes estaba duplicado en ProductScorePanel, el login de
// colaboradores y keywordSignals — centralizado aca para que no se desincronicen.
export const PRODUCT_LABELS: Record<string, string> = {
  libreInversion: "Libre inversión",
  hipotecario: "Hipotecario",
  mejoraVivienda: "Mejora de vivienda",
  educativo: "Educativo",
  mujeres: "Línea Mujer",
  compraCartera: "Compra de cartera",
  mipymes: "MiPymes",
  cupoRotativo: "Cupo rotativo",
};

export const PRODUCT_ICONS: Record<string, string> = {
  libreInversion: "💵",
  hipotecario: "🏠",
  mejoraVivienda: "🔨",
  educativo: "🎓",
  mujeres: "👩",
  compraCartera: "🔄",
  mipymes: "🏪",
  cupoRotativo: "💳",
};

export const PRODUCT_KEYS = Object.keys(PRODUCT_LABELS);
