"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCT_LABELS } from "@/lib/creditProducts";
import { Y, R, T } from "@/components/woop/tokens";

export default function ProspectoActionsPanel({
  cedula,
  nombre,
  topProduct,
  topValue,
  simuladorUrl,
  ofertaEnviadaAt,
}: {
  cedula: string;
  nombre: string;
  topProduct: string | null;
  topValue: number | null;
  simuladorUrl: string;
  ofertaEnviadaAt: string | Date | null;
}) {
  const [copiado, setCopiado] = useState(false);

  const productoLabel = topProduct ? PRODUCT_LABELS[topProduct] ?? topProduct : null;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(simuladorUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard no disponible (ej. http sin permisos) — el link sigue visible en pantalla
    }
  }

  return (
    <section className="rounded-3xl p-6" style={{ background: "linear-gradient(135deg, #16294D, #1A3A7A)" }}>
      <h2 className="font-display text-lg font-bold text-white">
        Este colaborador no ha usado el simulador de Woop
      </h2>
      <p className="font-data mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
        Todavía es un prospecto: no dejó ninguna necesidad declarada. Usá la recomendación del
        modelo y sus redes sociales para decidir cómo abordarlo, {nombre.split(" ")[0]}.
      </p>

      {productoLabel && (
        <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
          <p className="font-data text-xs uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
            Recomendación del modelo
          </p>
          <p className="font-display mt-1 text-xl font-extrabold" style={{ color: Y }}>
            {productoLabel}
            {topValue !== null && <span className="font-body text-base font-semibold"> · {topValue.toFixed(0)}%</span>}
          </p>
        </div>
      )}

      {ofertaEnviadaAt && (
        <p className="font-data mt-4 rounded-xl px-3 py-2 text-xs" style={{ background: `${T}30`, color: "#B9F5EA" }}>
          ✓ Última oferta enviada el {new Date(ofertaEnviadaAt).toLocaleString("es-CO")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Link
          href={`/colaboradores/${cedula}/recomendacion/oferta`}
          className="font-body rounded-2xl px-5 py-3 text-sm font-bold text-white transition active:scale-95"
          style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}
        >
          {ofertaEnviadaAt ? "✉️ Reenviar oferta por correo" : "✉️ Enviar oferta por correo"}
        </Link>
        <button
          onClick={copiarLink}
          className="font-body rounded-2xl px-5 py-3 text-sm font-bold text-white transition active:scale-95"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          {copiado ? "✓ Link copiado" : "🔗 Copiar link del simulador de Woop"}
        </button>
      </div>
    </section>
  );
}
