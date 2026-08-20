import { PRODUCT_LABELS } from "@/lib/creditProducts";

// Mensaje predeterminado que se le arma al asesor para ofrecerle un credito a
// un colaborador que todavia no uso el simulador de Woop, basado en la
// recomendacion del motor de probabilidad. Se usa tanto en la vista de preview
// del correo (donde el asesor lo puede editar) como fallback si no hay producto.
export function construirOfertaEmail({
  nombre,
  topProduct,
  topValue,
  simuladorUrl,
}: {
  nombre: string;
  topProduct: string | null;
  topValue: number | null;
  simuladorUrl: string;
}): { asunto: string; cuerpo: string } {
  const productoLabel = topProduct ? PRODUCT_LABELS[topProduct] ?? topProduct : null;
  const primerNombre = nombre.split(" ")[0];

  const asunto = productoLabel
    ? `Colsubsidio · Una opción de crédito para vos: ${productoLabel}`
    : "Colsubsidio · Conocé nuestras opciones de crédito";

  const cuerpo = productoLabel
    ? `Hola ${primerNombre},\n\nVimos que podrías calificar para nuestro crédito de ${productoLabel}` +
      `${topValue ? ` (${topValue.toFixed(0)}% de probabilidad estimada)` : ""}. ¿Te gustaría que` +
      ` revisemos juntos una simulación?\n\nPodés simular tu crédito acá: ${simuladorUrl}\n\nSaludos,\nEquipo Colsubsidio`
    : `Hola ${primerNombre},\n\nQueremos contarte sobre las opciones de crédito de Colsubsidio.` +
      ` Podés simular tu crédito acá: ${simuladorUrl}\n\nSaludos,\nEquipo Colsubsidio`;

  return { asunto, cuerpo };
}
