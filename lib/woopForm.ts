// Shape del metadata que guardan los eventos simulator_use / form_complete /
// contact_request generados en app/creditos/simulador/page.tsx (ver handleFinish
// y handleSolicitarContacto). Se centraliza aca para no repetir el parseo en cada
// pantalla que necesita mostrar "lo que la persona llenó en el formulario de Woop".
export interface WoopFormMetadata {
  monto?: number;
  plazoMeses?: number;
  tasaAnual?: number;
  cuotaMensual?: number;
  totalPagado?: number;
  totalIntereses?: number;
  ingresoMensual?: number;
  porcentajeIngresoComprometido?: number;
  proposito?: string;
  nombre?: string;
  cedula?: string;
  empresa?: string;
  celular?: string;
}

// Debe reflejar los ids de PURPOSES en app/creditos/simulador/page.tsx.
export const PROPOSITO_LABELS: Record<string, string> = {
  libre: "Libre inversión",
  vivienda: "Vivienda",
  auto: "Vehículo",
  edu: "Educación",
  salud: "Salud",
  negocio: "Mi negocio",
};

export function parseWoopFormMetadata(raw: string | null | undefined): WoopFormMetadata | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WoopFormMetadata;
  } catch {
    return null;
  }
}

export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}
