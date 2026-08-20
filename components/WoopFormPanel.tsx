"use client";

import { useState } from "react";
import { PROPOSITO_LABELS, soloDigitos, type WoopFormMetadata } from "@/lib/woopForm";
import { I, Y, R, T } from "@/components/woop/tokens";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function WoopFormPanel({
  userId,
  formData,
  solicitoContacto,
  fechaSolicitud,
  contactadoPorAsesor,
  contactadoAt,
  empleadoCorreo,
}: {
  userId: string;
  formData: WoopFormMetadata | null;
  solicitoContacto: boolean;
  fechaSolicitud: string | Date | null;
  contactadoPorAsesor: boolean;
  contactadoAt: string | Date | null;
  empleadoCorreo: string;
}) {
  const [contactado, setContactado] = useState(contactadoPorAsesor);
  const [fecha, setFecha] = useState(contactadoAt);
  const [loading, setLoading] = useState(false);

  async function toggleContactado() {
    setLoading(true);
    const nuevoValor = !contactado;
    try {
      const res = await fetch("/api/colaboradores/marcar-contactado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, contactado: nuevoValor }),
      });
      const data = await res.json();
      setContactado(data.contactadoPorAsesor);
      setFecha(data.contactadoAt);
    } finally {
      setLoading(false);
    }
  }

  if (!formData) {
    return (
      <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
        <h2 className="font-display text-lg font-bold" style={{ color: I }}>
          Formulario Woop (simulador)
        </h2>
        <p className="font-data mt-3 text-sm" style={{ color: `${I}40` }}>
          Este colaborador no completó el simulador de crédito en el sitio público.
        </p>
      </section>
    );
  }

  const celularDigitos = formData.celular ? soloDigitos(formData.celular) : null;
  const whatsappUrl = celularDigitos ? `https://wa.me/57${celularDigitos}` : null;
  const telUrl = celularDigitos ? `tel:+57${celularDigitos}` : null;
  const mailUrl = `mailto:${empleadoCorreo}`;

  return (
    <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold" style={{ color: I }}>
          Formulario Woop (simulador)
        </h2>
        {solicitoContacto && (
          <span
            className="font-data rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: `${R}18`, color: R }}
          >
            📞 Pidió ser contactado
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Monto buscado", formData.monto ? fmt(formData.monto) : "—"],
          ["Propósito / tipo de crédito", formData.proposito ? PROPOSITO_LABELS[formData.proposito] ?? formData.proposito : "—"],
          ["Plazo", formData.plazoMeses ? `${formData.plazoMeses} meses` : "—"],
          ["Tasa E.A. simulada", formData.tasaAnual ? `${(formData.tasaAnual * 100).toFixed(1)}%` : "—"],
          ["Cuota mensual", formData.cuotaMensual ? fmt(formData.cuotaMensual) : "—"],
          ["Total a pagar", formData.totalPagado ? fmt(formData.totalPagado) : "—"],
          ["Total intereses", formData.totalIntereses ? fmt(formData.totalIntereses) : "—"],
          formData.porcentajeIngresoComprometido !== undefined
            ? ["% ingreso comprometido", `${formData.porcentajeIngresoComprometido.toFixed(1)}%`]
            : null,
        ]
          .filter((row): row is [string, string] => row !== null)
          .map(([l, v]) => (
            <div key={l} className="rounded-xl p-3" style={{ background: "#F7F8FC" }}>
              <div className="font-data text-[11px] uppercase tracking-wide" style={{ color: `${I}50` }}>{l}</div>
              <div className="font-data mt-0.5 text-sm font-bold" style={{ color: I }}>{v}</div>
            </div>
          ))}
      </div>

      <div className="mt-4 rounded-xl p-3.5" style={{ background: "#FFF8EE" }}>
        <p className="font-data text-[11px] font-semibold uppercase tracking-wide" style={{ color: `${I}50` }}>
          Datos que dejó en el formulario
        </p>
        <p className="font-data mt-1 text-sm" style={{ color: I }}>
          {formData.nombre ?? "—"} · CC {formData.cedula ?? "—"} · {formData.empresa ?? "—"} ·{" "}
          {formData.celular ?? "sin celular"}
        </p>
        {fechaSolicitud && (
          <p className="font-data mt-1 text-[11px]" style={{ color: `${I}45` }}>
            Solicitó contacto el {new Date(fechaSolicitud).toLocaleString("es-CO")}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="font-data rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition"
            style={{ background: T }}
          >
            💬 WhatsApp
          </a>
        )}
        {telUrl && (
          <a
            href={telUrl}
            className="font-data rounded-xl px-4 py-2.5 text-xs font-semibold transition"
            style={{ background: "#F7F8FC", color: I }}
          >
            📞 Llamar
          </a>
        )}
        <a
          href={mailUrl}
          className="font-data rounded-xl px-4 py-2.5 text-xs font-semibold transition"
          style={{ background: "#F7F8FC", color: I }}
        >
          ✉️ Correo
        </a>
        <button
          onClick={toggleContactado}
          disabled={loading}
          className="font-data ml-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50"
          style={{ background: contactado ? `${I}90` : `linear-gradient(135deg, ${Y}, ${R})` }}
        >
          {loading ? "Guardando..." : contactado ? "✓ Contactado" : "Marcar como contactado"}
        </button>
      </div>
      {contactado && fecha && (
        <p className="font-data mt-2 text-right text-[11px]" style={{ color: `${I}40` }}>
          Marcado como contactado el {new Date(fecha).toLocaleString("es-CO")}
        </p>
      )}
    </section>
  );
}
