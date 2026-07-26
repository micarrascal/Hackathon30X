"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/tracking-client";
import WoopyMascot from "@/components/woop/WoopyMascot";
import WoopLockup from "@/components/woop/WoopLockup";
import { Y, R, T, I, C } from "@/components/woop/tokens";
import { CREDITOS, TASAS_MUJERES, MORA_ROWS } from "@/lib/creditos-data";

const BUSCABLES = [
  ...CREDITOS.map((c) => ({ tipo: "credito", titulo: c.nombre, texto: c.descripcion })),
  {
    tipo: "faq",
    titulo: "¿Cuánto tarda el desembolso?",
    texto: "El desembolso estimado es de 3 a 5 días hábiles tras la aprobación.",
  },
  {
    tipo: "faq",
    titulo: "¿Puedo prepagar mi crédito?",
    texto: "Sí, podés hacer abonos a capital o prepagar en cualquier momento.",
  },
  {
    tipo: "faq",
    titulo: "¿Qué documentos necesito?",
    texto: "Cédula, comprobante de ingresos y certificado laboral o de renta.",
  },
];

export default function CreditosPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof BUSCABLES | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    const filtered = BUSCABLES.filter(
      (b) =>
        b.titulo.toLowerCase().includes(term.toLowerCase()) ||
        b.texto.toLowerCase().includes(term.toLowerCase())
    );
    setResults(filtered);
    trackEvent("search", { searchTerm: term, metadata: { resultados: filtered.length } });
  }

  return (
    <main className="min-h-screen font-body" style={{ background: C }}>
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <WoopLockup size="sm" />
          <nav className="flex gap-4 text-sm font-data" style={{ color: `${I}90` }}>
            <Link href="/colaboradores" className="hover:opacity-70">
              Portal colaboradores
            </Link>
            <Link href="/dashboard" className="hover:opacity-70">
              Panel de leads
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — estilo WebOnboarding de Woop */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${I} 0%, #1A3A7A 60%, #0C4A46 100%)` }}
      >
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full"
          style={{ background: T, opacity: 0.08 }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full"
          style={{ background: Y, opacity: 0.07 }}
        />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-20 md:flex-row md:py-28">
          <WoopyMascot size={220} mood="wave" />
          <div className="text-center md:text-left">
            <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Créditos hechos
              <br />
              para ti ✨
            </h1>
            <p
              className="font-data mx-auto mt-5 max-w-md text-lg leading-relaxed md:mx-0"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Woop te ayuda a encontrar el crédito Colsubsidio ideal. Simulá tu cuota en
              minutos, sin papeles ni filas.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2 md:justify-start">
              {["⚡ Análisis en 3 min", "🔒 Datos seguros", "🎯 Oferta personalizada"].map((f) => (
                <span
                  key={f}
                  className="font-data rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)" }}
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="mt-9 flex justify-center gap-3 md:justify-start">
              <Link
                href="/creditos/simulador"
                onClick={() => trackEvent("click", { elementClicked: "hero_simular_ahora" })}
                className="font-body rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-lg transition active:scale-95"
                style={{ background: `linear-gradient(135deg, ${Y}, ${R})`, boxShadow: "0 12px 32px rgba(255,107,74,0.38)" }}
              >
                Simular ahora →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Buscador */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display mb-4 text-lg font-bold" style={{ color: I }}>
          Buscá información
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: vivienda, mujeres, desembolso..."
            className="font-data w-full rounded-xl border px-4 py-3 outline-none"
            style={{ borderColor: `${I}20`, color: I }}
          />
          <button
            type="submit"
            className="font-body rounded-xl px-6 py-3 font-semibold text-white transition active:scale-95"
            style={{ background: I }}
          >
            Buscar
          </button>
        </form>

        {results !== null && (
          <div className="mt-4 space-y-3">
            {results.length === 0 && (
              <p className="font-data text-sm" style={{ color: `${I}60` }}>
                No encontramos resultados para &ldquo;{query}&rdquo;.
              </p>
            )}
            {results.map((r, i) => (
              <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-data text-xs uppercase tracking-wide" style={{ color: T }}>
                  {r.tipo}
                </p>
                <p className="font-body font-semibold" style={{ color: I }}>
                  {r.titulo}
                </p>
                <p className="font-data text-sm" style={{ color: `${I}70` }}>
                  {r.texto}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Catálogo de 8 créditos reales */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display mb-6 text-lg font-bold" style={{ color: I }}>
          Nuestros créditos
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {CREDITOS.map((credito) => (
            <div
              key={credito.id}
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              style={credito.destacado ? { border: `2px solid ${Y}` } : { border: "1px solid rgba(22,41,77,0.08)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <span style={{ fontSize: 28 }}>{credito.icon}</span>
                {credito.tag && (
                  <span
                    className="font-data rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: `${Y}25`, color: "#7A5E00" }}
                  >
                    {credito.tag}
                  </span>
                )}
              </div>
              <h3 className="font-display mt-3 text-lg font-bold" style={{ color: I }}>
                {credito.nombre}
              </h3>
              <p className="font-data mt-1.5 text-sm" style={{ color: `${I}80` }}>
                {credito.descripcion}
              </p>
              <dl className="font-data mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt style={{ color: `${I}55` }}>Público</dt>
                  <dd className="text-right font-medium" style={{ color: I }}>{credito.publico}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: `${I}55` }}>Monto</dt>
                  <dd className="text-right font-medium" style={{ color: I }}>{credito.monto}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: `${I}55` }}>Plazo</dt>
                  <dd className="text-right font-medium" style={{ color: I }}>{credito.plazo}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: `${I}55` }}>Tasa</dt>
                  <dd className="text-right font-medium" style={{ color: T }}>{credito.tasa}</dd>
                </div>
              </dl>
              <ul className="font-data mt-3 space-y-1 text-xs" style={{ color: `${I}70` }}>
                {credito.requisitos.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              <Link
                href="/creditos/simulador"
                onClick={() => trackEvent("click", { elementClicked: `credito_${credito.id}` })}
                className="font-body mt-4 inline-block text-sm font-semibold hover:opacity-70"
                style={{ color: R }}
              >
                Simular este crédito →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Tasas Crédito Mujeres (única línea con tasas públicas) */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display mb-2 text-lg font-bold" style={{ color: I }}>
          Tasas — Crédito Mujeres
        </h2>
        <p className="font-data mb-6 text-sm" style={{ color: `${I}70` }}>
          Única línea de crédito con tasas publicadas explícitamente. E.A. = Efectivo Anual ·
          N.A. = Nominal Anual.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {(
            [
              { titulo: "No libranza", filas: TASAS_MUJERES.noLibranza },
              { titulo: "Libranza", filas: TASAS_MUJERES.libranza },
            ] as const
          ).map((tabla) => (
            <div key={tabla.titulo} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="font-body px-5 py-3 text-sm font-bold text-white" style={{ background: I }}>
                {tabla.titulo}
              </div>
              <table className="font-data w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${I}10` }}>
                    <th className="px-5 py-2 text-left" style={{ color: `${I}60` }}>Categoría</th>
                    <th className="px-5 py-2 text-right" style={{ color: `${I}60` }}>Tasa E.A.</th>
                    <th className="px-5 py-2 text-right" style={{ color: `${I}60` }}>Tasa N.A.</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.filas.map((fila) => (
                    <tr key={fila.categoria} style={{ borderBottom: `1px solid ${I}08` }}>
                      <td className="px-5 py-2 font-semibold" style={{ color: I }}>{fila.categoria}</td>
                      <td className="px-5 py-2 text-right font-bold" style={{ color: T }}>{fila.ea}</td>
                      <td className="px-5 py-2 text-right" style={{ color: `${I}80` }}>{fila.na}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Tabla de mora */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display mb-2 text-lg font-bold" style={{ color: I }}>
          Costos por mora
        </h2>
        <p className="font-data mb-6 text-sm" style={{ color: `${I}70` }}>
          Recargos administrativos de cobranza si un crédito entra en mora (no son tasas de
          interés).
        </p>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="font-data w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${I}10` }}>
                <th className="px-5 py-3 text-left" style={{ color: `${I}60` }}>Producto</th>
                <th className="px-5 py-3 text-left" style={{ color: `${I}60` }}>Tramo de mora</th>
                <th className="px-5 py-3 text-left" style={{ color: `${I}60` }}>Gasto de cobranza</th>
              </tr>
            </thead>
            <tbody>
              {MORA_ROWS.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${I}08` }}>
                  <td className="px-5 py-2.5 font-medium" style={{ color: I }}>{row.producto}</td>
                  <td className="px-5 py-2.5" style={{ color: `${I}80` }}>{row.tramo}</td>
                  <td className="px-5 py-2.5" style={{ color: `${I}80` }}>{row.costo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white py-6 text-center">
        <p className="font-data text-xs" style={{ color: `${I}45` }}>
          Este sitio es un demo de hackathon interno de Colsubsidio. Los usuarios, eventos y
          simulaciones que ves acá son datos sintéticos generados para la demo, no personas reales.
        </p>
      </footer>
    </main>
  );
}
