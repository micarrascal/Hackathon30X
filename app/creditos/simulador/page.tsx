"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/tracking-client";

interface SimulationResult {
  monto: number;
  plazoMeses: number;
  tasaAnual: number;
  cuotaMensual: number;
  totalPagado: number;
  totalIntereses: number;
  ingresoMensual?: number;
  porcentajeIngresoComprometido?: number;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function SimuladorPage() {
  const [monto, setMonto] = useState("10000000");
  const [plazoMeses, setPlazoMeses] = useState("24");
  const [ingresoMensual, setIngresoMensual] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formStarted = useRef(false);
  const formCompleted = useRef(false);

  function markFormStarted() {
    if (formStarted.current) return;
    formStarted.current = true;
    trackEvent("form_start", { pageUrl: "/creditos/simulador" });
  }

  useEffect(() => {
    function handleBeforeUnload() {
      if (formStarted.current && !formCompleted.current) {
        navigator.sendBeacon?.(
          "/api/track",
          new Blob(
            [
              JSON.stringify({
                userId: sessionStorage.getItem("h30x_session")
                  ? JSON.parse(sessionStorage.getItem("h30x_session")!).userId
                  : undefined,
                sessionId: sessionStorage.getItem("h30x_session")
                  ? JSON.parse(sessionStorage.getItem("h30x_session")!).sessionId
                  : undefined,
                eventType: "form_abandon",
                pageUrl: "/creditos/simulador",
              }),
            ],
            { type: "application/json" }
          )
        );
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: Number(monto),
          plazoMeses: Number(plazoMeses),
          ingresoMensual: ingresoMensual ? Number(ingresoMensual) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos calcular la simulación");
        return;
      }
      setResult(data);
      formCompleted.current = true;
      await trackEvent("simulator_use", { metadata: data });
      await trackEvent("form_complete", { pageUrl: "/creditos/simulador", metadata: data });
    } catch {
      setError("Ocurrió un error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/creditos" className="text-sm text-brand-600 hover:text-brand-800">
        ← Volver
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Simulador de crédito</h1>
      <p className="mt-2 text-gray-600">
        Completá los datos para conocer una estimación de tu cuota mensual.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Monto deseado (COP)</label>
          <input
            type="number"
            min={100000}
            step={100000}
            value={monto}
            onFocus={markFormStarted}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Plazo (meses)</label>
          <input
            type="number"
            min={1}
            max={360}
            value={plazoMeses}
            onFocus={markFormStarted}
            onChange={(e) => setPlazoMeses(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ingreso mensual (opcional)
          </label>
          <input
            type="number"
            min={0}
            value={ingresoMensual}
            onFocus={markFormStarted}
            onChange={(e) => setIngresoMensual(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Calculando..." : "Calcular cuota"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Resultado de tu simulación</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Cuota mensual estimada</dt>
              <dd className="text-xl font-bold text-brand-700">
                {formatCurrency(result.cuotaMensual)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Plazo</dt>
              <dd className="font-semibold text-gray-900">{result.plazoMeses} meses</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total a pagar</dt>
              <dd className="font-semibold text-gray-900">{formatCurrency(result.totalPagado)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total de intereses</dt>
              <dd className="font-semibold text-gray-900">{formatCurrency(result.totalIntereses)}</dd>
            </div>
            {result.porcentajeIngresoComprometido !== undefined && (
              <div className="col-span-2">
                <dt className="text-gray-500">% de tu ingreso comprometido en la cuota</dt>
                <dd className="font-semibold text-gray-900">
                  {result.porcentajeIngresoComprometido.toFixed(1)}%
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-6 rounded-lg bg-white p-3 text-xs text-gray-500">
            ⚠️ Esto es una simulación, no una preaprobación. Los valores reales pueden variar
            según tu perfil crediticio y las condiciones vigentes al momento de solicitar el
            crédito.
          </p>
        </div>
      )}
    </main>
  );
}
