// Calculo deterministico de amortizacion francesa (cuota fija).
// Esta funcion NO usa el LLM: la usan tanto el simulador tradicional como el chatbot,
// para garantizar que la cifra mostrada al usuario sea siempre la misma via el mismo camino.

export const TASA_ANUAL_DEFAULT = 0.18; // 18% E.A. nominal simplificada, solo para fines de demo

export interface SimulationInput {
  monto: number;
  plazoMeses: number;
  ingresoMensual?: number;
  tasaAnual?: number;
}

export interface SimulationResult {
  monto: number;
  plazoMeses: number;
  tasaAnual: number;
  tasaMensual: number;
  cuotaMensual: number;
  totalPagado: number;
  totalIntereses: number;
  ingresoMensual?: number;
  porcentajeIngresoComprometido?: number;
}

export function calcularSimulacion(input: SimulationInput): SimulationResult {
  const { monto, plazoMeses } = input;
  const tasaAnual = input.tasaAnual ?? TASA_ANUAL_DEFAULT;

  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error("El monto debe ser un numero mayor a 0");
  }
  if (!Number.isFinite(plazoMeses) || plazoMeses <= 0) {
    throw new Error("El plazo debe ser un numero de meses mayor a 0");
  }

  const tasaMensual = tasaAnual / 12;
  const factor = Math.pow(1 + tasaMensual, plazoMeses);
  const cuotaMensual = (monto * tasaMensual * factor) / (factor - 1);

  const totalPagado = cuotaMensual * plazoMeses;
  const totalIntereses = totalPagado - monto;

  const result: SimulationResult = {
    monto,
    plazoMeses,
    tasaAnual,
    tasaMensual,
    cuotaMensual: round2(cuotaMensual),
    totalPagado: round2(totalPagado),
    totalIntereses: round2(totalIntereses),
  };

  if (input.ingresoMensual && input.ingresoMensual > 0) {
    result.ingresoMensual = input.ingresoMensual;
    result.porcentajeIngresoComprometido = round2(
      (cuotaMensual / input.ingresoMensual) * 100
    );
  }

  return result;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
