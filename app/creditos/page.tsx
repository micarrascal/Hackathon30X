"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/tracking-client";

const TIPOS_CREDITO = [
  {
    id: "libre-inversion",
    nombre: "Libre inversión",
    descripcion: "Usalo para lo que necesites: viajes, remodelaciones, imprevistos.",
    monto: "Hasta $50.000.000",
  },
  {
    id: "vehiculo",
    nombre: "Crédito de vehículo",
    descripcion: "Financiá tu vehículo nuevo o usado con cuotas fijas.",
    monto: "Hasta $120.000.000",
  },
  {
    id: "educativo",
    nombre: "Crédito educativo",
    descripcion: "Para vos o tu familia: pregrado, posgrado y cursos certificados.",
    monto: "Hasta $30.000.000",
  },
  {
    id: "vivienda",
    nombre: "Crédito de vivienda",
    descripcion: "Compra, remodelación o mejora de tu vivienda.",
    monto: "Hasta $300.000.000",
  },
];

const BUSCABLES = [
  ...TIPOS_CREDITO.map((t) => ({ tipo: "credito", titulo: t.nombre, texto: t.descripcion })),
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
    <main className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-brand-700">Colsubsidio</span>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/colaboradores" className="hover:text-brand-700">
              Portal colaboradores (buscar por cédula)
            </Link>
            <Link href="/dashboard" className="hover:text-brand-700">
              Panel de leads (visitantes)
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            El crédito que necesitás, sin vueltas
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Simulá tu crédito en minutos y conocé la cuota estimada antes de solicitarlo.
            Sin compromiso, sin letra chica.
          </p>
          <div className="mt-8">
            <Link
              href="/creditos/simulador"
              onClick={() => trackEvent("click", { elementClicked: "hero_simular_ahora" })}
              className="inline-block rounded-lg bg-brand-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Simular ahora
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Buscá información</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: vehículo, desembolso, prepago..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-5 py-2 font-medium text-white hover:bg-gray-700"
          >
            Buscar
          </button>
        </form>

        {results !== null && (
          <div className="mt-4 space-y-3">
            {results.length === 0 && (
              <p className="text-sm text-gray-500">No encontramos resultados para “{query}”.</p>
            )}
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-brand-600">{r.tipo}</p>
                <p className="font-semibold text-gray-900">{r.titulo}</p>
                <p className="text-sm text-gray-600">{r.texto}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">Tipos de crédito</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {TIPOS_CREDITO.map((tipo) => (
            <div key={tipo.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">{tipo.nombre}</h3>
              <p className="mt-2 text-sm text-gray-600">{tipo.descripcion}</p>
              <p className="mt-3 text-sm font-medium text-brand-700">{tipo.monto}</p>
              <Link
                href="/creditos/simulador"
                onClick={() =>
                  trackEvent("click", { elementClicked: `credito_${tipo.id}` })
                }
                className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-800"
              >
                Simular este crédito →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        Este sitio es un demo de hackathon interno de Colsubsidio. Los usuarios, eventos y
        simulaciones que ves acá son datos sintéticos generados para la demo, no personas reales.
      </footer>
    </main>
  );
}
