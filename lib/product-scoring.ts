import type { Employee, Event, Session } from "@prisma/client";

// Motor de probabilidad por producto de credito — determinista, sin LLM.
// Son reglas de negocio ilustrativas para la demo (no un modelo estadistico real).
// Los 5 scores se normalizan para que sumen 100.

export interface ProductScores {
  cupoCredito: number;
  consumo: number;
  vivienda: number;
  mujeres: number;
  educativo: number;
  topProduct: string;
}

const SALARIO_ALTO = 4_000_000;

function textoIncluye(events: Event[], ...keywords: string[]): boolean {
  const haystacks = events.flatMap((e) => [e.searchTerm, e.pageUrl, e.elementClicked]);
  return haystacks.some((h) =>
    keywords.some((k) => (h ?? "").toLowerCase().includes(k))
  );
}

export function calcularProbabilidadesProducto(
  employee: Employee,
  events: Event[],
  sessions: Session[]
): ProductScores {
  const usoSimulador = events.some(
    (e) => e.eventType === "simulator_use" || e.eventType === "chatbot_simulacion"
  );
  const clickLibreInversion = events.some(
    (e) => e.elementClicked === "credito_libre-inversion"
  );
  const formCompletePequeno = events.some((e) => {
    if (e.eventType !== "form_complete" || !e.metadata) return false;
    try {
      const meta = JSON.parse(e.metadata);
      return typeof meta.monto === "number" && meta.monto <= 15_000_000;
    } catch {
      return false;
    }
  });

  let vivienda = 10;
  if (employee.antiguedad >= 3) vivienda += 15;
  if (employee.edad >= 28 && employee.edad <= 45) vivienda += 10;
  if (employee.salario >= SALARIO_ALTO) vivienda += 15;
  if (textoIncluye(events, "vivienda")) vivienda += 25;

  let mujeres = 5;
  if (employee.genero === "F") {
    mujeres += 40;
    if (employee.hijos >= 1) mujeres += 10;
    if (textoIncluye(events, "mujer")) mujeres += 20;
  }

  let educativo = 10;
  if (employee.antiguedad < 3) educativo += 10;
  if (employee.edad <= 35) educativo += 10;
  if (textoIncluye(events, "educativo", "curso")) educativo += 25;

  let consumo = 20;
  if (usoSimulador) consumo += 20;
  if (clickLibreInversion) consumo += 25;

  let cupoCredito = 10;
  if (employee.antiguedad >= 1) cupoCredito += 10;
  if (sessions.length >= 3) cupoCredito += 15;
  if (formCompletePequeno) cupoCredito += 10;

  const raw = { cupoCredito, consumo, vivienda, mujeres, educativo };
  const total = Object.values(raw).reduce((sum, v) => sum + v, 0) || 1;

  const normalized = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Math.round((value / total) * 1000) / 10])
  ) as Record<keyof typeof raw, number>;

  const topProduct = (Object.entries(normalized) as [keyof typeof raw, number][]).reduce(
    (best, current) => (current[1] > best[1] ? current : best)
  )[0];

  return { ...normalized, topProduct };
}

export const PRODUCT_LABELS: Record<string, string> = {
  cupoCredito: "Cupo de crédito",
  consumo: "Crédito de consumo / libre inversión",
  vivienda: "Crédito de vivienda",
  mujeres: "Línea Mujer",
  educativo: "Crédito educativo",
};
