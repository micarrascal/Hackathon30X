"use client";

import { useState } from "react";
import Link from "next/link";
import { I, Y, R, T } from "@/components/woop/tokens";

export default function OfertaEmailForm({
  cedula,
  destinatario,
  asuntoInicial,
  cuerpoInicial,
  productoTop,
  ofertaEnviadaAt: ofertaEnviadaAtInicial,
}: {
  cedula: string;
  destinatario: string;
  asuntoInicial: string;
  cuerpoInicial: string;
  productoTop: string | null;
  ofertaEnviadaAt: string | Date | null;
}) {
  const [asunto, setAsunto] = useState(asuntoInicial);
  const [cuerpo, setCuerpo] = useState(cuerpoInicial);
  const [ofertaEnviadaAt, setOfertaEnviadaAt] = useState(ofertaEnviadaAtInicial);
  const [guardando, setGuardando] = useState(false);

  const mailtoUrl = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

  async function handleEnviar() {
    setGuardando(true);
    try {
      const res = await fetch("/api/colaboradores/marcar-oferta-enviada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, producto: productoTop }),
      });
      const data = await res.json();
      setOfertaEnviadaAt(data.ofertaEnviadaAt);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
      {ofertaEnviadaAt && (
        <p className="font-data mb-4 rounded-xl p-3 text-xs" style={{ background: `${T}18`, color: T }}>
          ✓ Se marcó como enviada el {new Date(ofertaEnviadaAt).toLocaleString("es-CO")}. Podés editar y volver a
          enviar si hace falta.
        </p>
      )}

      <div className="mb-4">
        <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>
          Para
        </label>
        <input
          value={destinatario}
          disabled
          className="font-data w-full rounded-xl px-4 py-2.5 text-sm"
          style={{ background: "#F7F8FC", border: `1.5px solid ${I}10`, color: `${I}70` }}
        />
      </div>

      <div className="mb-4">
        <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>
          Asunto
        </label>
        <input
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          className="font-data w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: "#F7F8FC", border: `1.5px solid ${I}10`, color: I }}
        />
      </div>

      <div className="mb-5">
        <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>
          Mensaje
        </label>
        <textarea
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          rows={10}
          className="font-data w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: "#F7F8FC", border: `1.5px solid ${I}10`, color: I, resize: "vertical" }}
        />
        <p className="font-data mt-1.5 text-[11px]" style={{ color: `${I}40` }}>
          Podés editar el mensaje antes de enviarlo — se abre en tu cliente de correo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <a
          href={mailtoUrl}
          onClick={handleEnviar}
          className="font-body rounded-2xl px-5 py-3 text-sm font-bold text-white transition active:scale-95"
          style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}
        >
          {guardando ? "Abriendo correo…" : "✉️ Enviar"}
        </a>
        <Link
          href={`/colaboradores/${cedula}/recomendacion`}
          className="font-body rounded-2xl px-5 py-3 text-sm font-semibold transition"
          style={{ background: "#F7F8FC", color: I }}
        >
          ← Volver a la recomendación
        </Link>
      </div>
    </section>
  );
}
