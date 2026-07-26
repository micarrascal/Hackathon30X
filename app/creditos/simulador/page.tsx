"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/tracking-client";
import WoopyMascot from "@/components/woop/WoopyMascot";
import WoopLockup from "@/components/woop/WoopLockup";
import { Y, R, T, I, C } from "@/components/woop/tokens";

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

const PURPOSES = [
  { id: "libre", label: "Libre inversión", emoji: "🎯" },
  { id: "vivienda", label: "Vivienda", emoji: "🏠" },
  { id: "auto", label: "Vehículo", emoji: "🚗" },
  { id: "edu", label: "Educación", emoji: "📚" },
  { id: "salud", label: "Salud", emoji: "🏥" },
  { id: "negocio", label: "Mi negocio", emoji: "💼" },
];

const TERMS = [12, 24, 36, 48, 60];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;

async function simular(monto: number, plazoMeses: number, ingresoMensual?: number): Promise<SimulationResult> {
  const res = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monto, plazoMeses, ingresoMensual }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No pudimos calcular la simulación");
  return data;
}

export default function SimuladorPage() {
  const [step, setStep] = useState(0);
  const [monto, setMonto] = useState(8_500_000);
  const [proposito, setProposito] = useState("libre");
  const [plazoMeses, setPlazoMeses] = useState(24);
  const [cuotasPorPlazo, setCuotasPorPlazo] = useState<Record<number, number>>({});
  const [nombre, setNombre] = useState("María Alejandra González");
  const [cedula, setCedula] = useState("1.234.567.890");
  const [ingresoMensual, setIngresoMensual] = useState("3800000");
  const [empresa, setEmpresa] = useState("Tecnología S.A.S.");
  const [celular, setCelular] = useState("310 000 0000");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactoSolicitado, setContactoSolicitado] = useState(false);
  const [enviandoContacto, setEnviandoContacto] = useState(false);

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
        const raw = sessionStorage.getItem("h30x_session");
        const ids = raw ? JSON.parse(raw) : {};
        navigator.sendBeacon?.(
          "/api/track",
          new Blob(
            [
              JSON.stringify({
                userId: ids.userId,
                sessionId: ids.sessionId,
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

  // Al llegar al paso de plazo, trae la cuota REAL (via /api/simulate) para cada opción de plazo.
  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    Promise.all(TERMS.map((t) => simular(monto, t).then((r) => [t, r.cuotaMensual] as const)))
      .then((entries) => {
        if (!cancelled) setCuotasPorPlazo(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setCuotasPorPlazo({});
      });
    return () => {
      cancelled = true;
    };
  }, [step, monto]);

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await simular(monto, plazoMeses, ingresoMensual ? Number(ingresoMensual) : undefined);
      setResult(data);
      formCompleted.current = true;
      await trackEvent("simulator_use", { metadata: { ...data, proposito, nombre, cedula, empresa, celular } });
      await trackEvent("form_complete", { pageUrl: "/creditos/simulador", metadata: { ...data } });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSolicitarContacto() {
    if (!result || enviandoContacto) return;
    setEnviandoContacto(true);
    try {
      await trackEvent("contact_request", {
        pageUrl: "/creditos/simulador",
        metadata: { ...result, proposito, nombre, cedula, empresa, celular },
      });
      setContactoSolicitado(true);
    } finally {
      setEnviandoContacto(false);
    }
  }

  const stepLabels = ["¿Cuánto necesitas?", "¿Para qué es?", "¿En cuántos meses?", "Tu información"];
  const questions = [
    "¿Cuánto dinero necesitas?",
    `Perfecto, ${fmtM(monto)} 💰 ¿Para qué es?`,
    "¡Genial! ¿En cuántos meses quieres pagarlo?",
    "Casi listo... Cuéntame un poco sobre ti 🌟",
  ];

  if (step === 4 && result) {
    return (
      <main
        className="relative flex min-h-screen items-center overflow-hidden font-body"
        style={{ background: `linear-gradient(160deg, ${I} 0%, #1A3A7A 45%, #0C5250 100%)` }}
      >
        <div className="pointer-events-none absolute -right-40 -top-36 h-96 w-96 rounded-full" style={{ background: Y, opacity: 0.06 }} />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full" style={{ background: T, opacity: 0.08 }} />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 py-16 md:flex-row">
          <div className="text-center">
            <div className="font-data mb-2 text-sm uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
              Tu oferta personalizada
            </div>
            <div className="font-display font-extrabold" style={{ fontSize: 60, color: Y, lineHeight: 1 }}>
              ¡Woop!
            </div>
            <p className="font-data mt-2 text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
              Woopy encontró una simulación para vos 🎉
            </p>
            <div className="mt-4 flex justify-center">
              <WoopyMascot size={220} mood="money" />
            </div>
          </div>

          <div className="w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between px-7 py-5" style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}>
              <WoopLockup size="sm" />
              <span className="font-data rounded-full px-3 py-1 text-xs font-bold" style={{ background: I, color: Y }}>
                SIMULACIÓN
              </span>
            </div>
            <div className="bg-white px-7 pb-6 pt-7">
              <div className="mb-6 text-center">
                <div className="font-display font-extrabold" style={{ fontSize: 44, color: I, lineHeight: 1 }}>
                  {fmt(result.monto)}
                </div>
                <div className="font-data mt-1 text-sm" style={{ color: `${I}70` }}>Monto simulado</div>
              </div>
              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { l: "Cuota/mes", v: fmt(result.cuotaMensual), c: R },
                  { l: "Plazo", v: `${result.plazoMeses} meses`, c: T },
                  { l: "Tasa E.A.", v: `${(result.tasaAnual * 100).toFixed(1)}%`, c: Y },
                ].map((x) => (
                  <div key={x.l} className="rounded-2xl py-4 text-center" style={{ background: `${I}06` }}>
                    <div className="font-display text-base font-extrabold" style={{ color: x.c }}>{x.v}</div>
                    <div className="font-data mt-1 text-xs" style={{ color: `${I}55` }}>{x.l}</div>
                  </div>
                ))}
              </div>
              {result.porcentajeIngresoComprometido !== undefined && (
                <div className="mb-5 rounded-xl py-3 text-center text-sm font-semibold" style={{ background: `${T}12`, color: T }}>
                  {result.porcentajeIngresoComprometido.toFixed(1)}% de tu ingreso comprometido
                </div>
              )}
              <p className="font-data mb-5 rounded-xl bg-gray-50 p-3 text-xs" style={{ color: `${I}70` }}>
                ⚠️ Esto es una simulación, no una preaprobación. Los valores reales pueden variar
                según tu perfil crediticio al momento de solicitar el crédito.
              </p>

              {contactoSolicitado ? (
                <div
                  className="mb-3 flex items-center justify-center gap-2 rounded-2xl py-4 text-center font-body text-sm font-bold"
                  style={{ background: `${T}15`, color: T }}
                >
                  ✓ ¡Listo! Un asesor de Colsubsidio te va a contactar pronto.
                </div>
              ) : (
                <button
                  onClick={handleSolicitarContacto}
                  disabled={enviandoContacto}
                  className="mb-3 w-full rounded-2xl py-4 text-center font-body text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${Y}, ${R})`, boxShadow: "0 8px 24px rgba(255,107,74,0.35)" }}
                >
                  {enviandoContacto ? "Enviando..." : "📞 Estoy interesado, quiero ser contactado"}
                </button>
              )}

              <Link
                href="/creditos"
                className="block w-full rounded-2xl py-4 text-center font-body text-sm font-bold text-white active:scale-95"
                style={{ background: I }}
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen overflow-hidden font-body">
      {/* Panel asistente */}
      <div
        className="relative hidden w-[380px] shrink-0 flex-col items-center overflow-hidden p-12 md:flex"
        style={{ background: `linear-gradient(160deg, ${I} 0%, #1A3A7A 100%)` }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full" style={{ background: T, opacity: 0.07 }} />
        <div className="mb-6"><WoopyMascot size={150} mood="thinking" /></div>
        <div className="mb-6 flex w-full gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= step ? Y : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div
          className="w-full rounded-tr-md rounded-bl-2xl rounded-br-2xl rounded-tl-2xl border p-4"
          style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.12)" }}
        >
          <p className="font-data text-sm leading-relaxed text-white">{questions[step]}</p>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-6">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-data text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Woopy · Asistente</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col overflow-hidden" style={{ background: C }}>
        <div className="border-b border-black/5 bg-white px-8 py-6 md:px-12">
          <Link href="/creditos" className="font-data text-xs" style={{ color: `${I}50` }}>
            ← Volver
          </Link>
          <div className="font-data mt-2 text-xs font-semibold uppercase tracking-widest" style={{ color: `${I}45` }}>
            Paso {step + 1} de 4
          </div>
          <div className="font-display text-2xl font-bold" style={{ color: I }}>{stepLabels[step]}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          {step === 0 && (
            <div className="max-w-lg" onFocus={markFormStarted}>
              <div className="font-display font-extrabold" style={{ fontSize: 44, color: I }}>{fmt(monto)}</div>
              <div className="font-data mb-8 mt-1 text-sm" style={{ color: `${I}55` }}>Monto del crédito</div>
              <input
                type="range"
                min={500000}
                max={50000000}
                step={500000}
                value={monto}
                onFocus={markFormStarted}
                onChange={(e) => setMonto(Number(e.target.value))}
                className="mb-2 h-2.5 w-full cursor-pointer appearance-none rounded-full"
              />
              <div className="font-data mb-8 flex justify-between text-sm" style={{ color: `${I}45` }}>
                <span>$500K</span>
                <span>$50M</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {[1_000_000, 3_000_000, 5_000_000, 8_000_000, 15_000_000, 25_000_000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMonto(v)}
                    className="font-data rounded-xl py-3 text-sm font-semibold transition active:scale-95"
                    style={{
                      background: monto === v ? Y : "white",
                      color: monto === v ? I : `${I}70`,
                      border: `1.5px solid ${monto === v ? Y : `${I}12`}`,
                    }}
                  >
                    {fmtM(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
              {PURPOSES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProposito(p.id)}
                  className="flex flex-col items-center gap-3 rounded-2xl py-8 transition active:scale-95"
                  style={{
                    background: proposito === p.id ? `linear-gradient(135deg, ${Y}, ${R})` : "white",
                    border: `1.5px solid ${proposito === p.id ? "transparent" : `${I}0E`}`,
                  }}
                >
                  <span style={{ fontSize: 36 }}>{p.emoji}</span>
                  <span className="font-data text-sm font-semibold" style={{ color: proposito === p.id ? "white" : `${I}80` }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex max-w-lg flex-col gap-3">
              {TERMS.map((t) => (
                <button
                  key={t}
                  onClick={() => setPlazoMeses(t)}
                  className="flex items-center justify-between rounded-2xl px-6 py-5 transition active:scale-[.98]"
                  style={{
                    background: plazoMeses === t ? I : "white",
                    border: `1.5px solid ${plazoMeses === t ? "transparent" : `${I}0E`}`,
                  }}
                >
                  <div className="text-left">
                    <div className="font-body text-base font-bold" style={{ color: plazoMeses === t ? "white" : I }}>{t} meses</div>
                    <div className="font-data text-sm" style={{ color: plazoMeses === t ? "rgba(255,255,255,0.5)" : `${I}45` }}>
                      {t <= 12 ? "Corto plazo" : t <= 36 ? "Plazo medio" : "Largo plazo"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-extrabold" style={{ color: plazoMeses === t ? Y : R }}>
                      {cuotasPorPlazo[t] ? fmt(cuotasPorPlazo[t]) : "..."}
                    </div>
                    <div className="font-data text-sm" style={{ color: plazoMeses === t ? "rgba(255,255,255,0.45)" : `${I}40` }}>/mes</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="grid max-w-lg grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>Nombre completo</label>
                <input
                  value={nombre}
                  onFocus={markFormStarted}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="María Alejandra González"
                  className="font-data w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={{ background: "white", border: `1.5px solid ${I}12`, color: I }}
                  required
                />
              </div>
              <div>
                <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>Número de cédula</label>
                <input
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="1.234.567.890"
                  className="font-data w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={{ background: "white", border: `1.5px solid ${I}12`, color: I }}
                  required
                />
              </div>
              <div>
                <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>Ingresos mensuales</label>
                <input
                  type="number"
                  value={ingresoMensual}
                  onChange={(e) => setIngresoMensual(e.target.value)}
                  placeholder="3800000"
                  className="font-data w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={{ background: "white", border: `1.5px solid ${I}12`, color: I }}
                />
              </div>
              <div>
                <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>Empresa empleadora</label>
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Tecnología S.A.S."
                  className="font-data w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={{ background: "white", border: `1.5px solid ${I}12`, color: I }}
                />
              </div>
              <div>
                <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>Número de celular</label>
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="310 000 0000"
                  className="font-data w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={{ background: "white", border: `1.5px solid ${I}12`, color: I }}
                />
              </div>
              {error && <p className="col-span-2 font-data text-sm text-red-600">{error}</p>}
            </form>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-black/5 bg-white px-8 py-6 md:px-12">
          <button
            onClick={() => step > 0 && setStep((s) => s - 1)}
            className="font-data rounded-xl px-6 py-3 text-sm font-semibold transition"
            style={{ color: step > 0 ? I : `${I}30`, background: `${I}07` }}
          >
            ← Anterior
          </button>
          <button
            onClick={(e) => (step < 3 ? setStep((s) => s + 1) : handleFinish(e))}
            disabled={loading || (step === 1 && !proposito)}
            className="font-body rounded-2xl px-10 py-4 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}
          >
            {loading ? "Calculando..." : step < 3 ? "Siguiente →" : "Ver mi simulación ✨"}
          </button>
        </div>
      </div>
    </main>
  );
}
