// Datos reales de las 8 lineas de credito de Colsubsidio, sintetizados de
// `UI_UX System for Woop (1)/src/imports/credito.md` (a su vez condensado de
// contenido real rastreado bajo colsubsidio.com/creditos). Las tasas de interes
// no publicadas se muestran como tales — solo Credito Mujeres tiene tasa publica.

export interface CreditoInfo {
  id: string;
  icon: string;
  nombre: string;
  tag?: string;
  descripcion: string;
  publico: string;
  monto: string;
  plazo: string;
  requisitos: string[];
  tasa: string;
  destacado?: boolean;
}

export const CREDITOS: CreditoInfo[] = [
  {
    id: "libre-inversion",
    icon: "🎯",
    nombre: "Crédito de libre inversión",
    descripcion: "Para lo que necesites: viajes, imprevistos, remodelaciones o lo que se te ocurra.",
    publico: "Todas las categorías de afiliación; disponible incluso sin vida crediticia",
    monto: "Desde 1 SMMLV hasta $150.000.000",
    plazo: "Según capacidad de pago",
    requisitos: ["Aprobación rápida", "Desembolso a cuenta bancaria registrada"],
    tasa: "No publicada (tasas preferenciales por categoría)",
  },
  {
    id: "hipotecario",
    icon: "🏠",
    nombre: "Crédito Hipotecario",
    descripcion: "Compra tu vivienda nueva, VIS o no VIS, con Colsubsidio o constructoras aliadas.",
    publico: "Afiliados categorías A y B",
    monto: "Según proyecto/constructora",
    plazo: "60 a 240 meses (5 a 20 años)",
    requisitos: ["Vivienda nueva VIS o no VIS", "Proyectos Colsubsidio o constructoras aliadas"],
    tasa: "No publicada",
  },
  {
    id: "mejora-vivienda",
    icon: "🔧",
    nombre: "Complementario para mejora de vivienda",
    descripcion: "Cuota inicial, escrituración o acabados — para quien ya tiene un hipotecario Colsubsidio.",
    publico: "Afiliados con crédito hipotecario Colsubsidio ya aprobado",
    monto: "Hasta 25 SMMLV",
    plazo: "12 a 96 meses",
    requisitos: ["Debe tener crédito de vivienda previamente aprobado con Colsubsidio"],
    tasa: "No publicada",
  },
  {
    id: "educativo",
    icon: "📚",
    nombre: "Crédito Educativo",
    descripcion: "Técnico, tecnológico, pregrado, posgrado, maestría, doctorado o cursos libres.",
    publico: "Estudiantes en Colombia o el exterior",
    monto: "Desde $300.000 o 0,5 SMMLV",
    plazo: "6 a 96 meses según duración del programa",
    requisitos: ["Firmar pagaré como deudor, o contar con codeudor", "Financia hasta el 100% del semestre"],
    tasa: "Tasas preferenciales para afiliados (sin cifra pública)",
  },
  {
    id: "mujeres",
    icon: "👩",
    nombre: "Crédito Mujeres",
    tag: "✦ Única línea con tasas públicas",
    descripcion: "Línea exclusiva para mujeres afiliadas, emprendedoras o cabeza de familia.",
    publico: "Mujeres afiliadas, emprendedoras o cabeza de familia · 18–69 años",
    monto: "Desde 0,5 SMMLV, entre $800.000 y $6.000.000",
    plazo: "Hasta 36 meses",
    requisitos: [
      "Ingresos > 1 SMMLV, sin reportes negativos",
      "Asalariadas: contrato vigente + 2 meses de antigüedad",
      "Pensionadas: aportes vigentes + 6 meses de antigüedad",
      "Independientes: actividad > 1 año + 1 año de afiliación",
      "Incluye protección oncológica (GEA Colombia)",
    ],
    tasa: "Ver tabla de tasas más abajo",
    destacado: true,
  },
  {
    id: "compra-cartera",
    icon: "🔄",
    nombre: "Compra de cartera",
    descripcion: "Consolidá varias deudas de otras entidades en un solo pago con tasa fija.",
    publico: "Afiliados que quieren consolidar deudas de otras entidades",
    monto: "Según capacidad de endeudamiento",
    plazo: "6 a 60 meses",
    requisitos: ["Ser afiliado", "Incluye seguro de deudores y amparo por desempleo hasta 9 cuotas"],
    tasa: "No publicada",
  },
  {
    id: "mipymes",
    icon: "💼",
    nombre: "Crédito MiPymes",
    descripcion: "Para capital de trabajo, modernización o activos fijos de tu empresa.",
    publico: "Micro, pequeñas y medianas empresas afiliadas a Colsubsidio",
    monto: "No especificado",
    plazo: "No especificado",
    requisitos: ["Empresa afiliada a Colsubsidio", "Estudio de crédito sin costo", "Respaldo del Fondo Nacional de Garantías"],
    tasa: "Tasas competitivas (sin cifra pública)",
  },
  {
    id: "cupo-rotativo",
    icon: "💳",
    nombre: "Cupo de Crédito (rotativo)",
    descripcion: "Ligado a la Tarjeta Colsubsidio: avances en efectivo y +14.400 establecimientos.",
    publico: "Todas las categorías de afiliación",
    monto: "Cupo rotativo, sin monto fijo",
    plazo: "Rotativo (sin plazo fijo)",
    requisitos: ["Ser afiliado y tener Tarjeta Colsubsidio", "Avances en efectivo hasta 50% del cupo"],
    tasa: "Tasas preferenciales (sin cifra pública)",
  },
];

export const TASAS_MUJERES = {
  noLibranza: [
    { categoria: "A", ea: "20,79%", na: "1,59%" },
    { categoria: "B", ea: "21,91%", na: "1,66%" },
    { categoria: "C", ea: "23,03%", na: "1,74%" },
    { categoria: "No afiliado", ea: "24,15%", na: "1,82%" },
  ],
  libranza: [
    { categoria: "A", ea: "18,30%", na: "1,41%" },
    { categoria: "B", ea: "19,20%", na: "1,47%" },
    { categoria: "C", ea: "20,10%", na: "1,54%" },
  ],
};

export const MORA_ROWS = [
  { producto: "Cupo de crédito", tramo: "1–15 días", costo: "Sin costo" },
  { producto: "Cupo de crédito", tramo: "16–59 días", costo: "10% + IVA" },
  { producto: "Cupo de crédito", tramo: "Más de 60 días", costo: "16% + IVA" },
  { producto: "Consumo no libranza", tramo: "1–15 días", costo: "Sin costo" },
  { producto: "Consumo no libranza", tramo: "15–29 días", costo: "3,5% + IVA" },
  { producto: "Consumo no libranza", tramo: "30–59 días", costo: "7,5% + IVA" },
  { producto: "Consumo no libranza", tramo: "Más de 60 días", costo: "15% + IVA" },
  { producto: "Hipotecario", tramo: "Todos los tramos", costo: "Sin costo (Colsubsidio lo asume)" },
  { producto: "MiPymes", tramo: "1–29 días", costo: "Sin costo" },
  { producto: "MiPymes", tramo: "30–59 días", costo: "7,5% + IVA" },
  { producto: "MiPymes", tramo: "Más de 60 días", costo: "15% + IVA" },
];
