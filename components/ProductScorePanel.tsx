"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScoreRing from "@/components/woop/ScoreRing";
import { I, Y, R, T } from "@/components/woop/tokens";
import { PRODUCT_LABELS, PRODUCT_ICONS, PRODUCT_KEYS } from "@/lib/creditProducts";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

interface Acierto {
  porcentajeAcierto: number;
  similitudProducto: number;
  ajusteMonto: number;
  montoMaximoFinanciable: number;
}

interface ScoreData {
  libreInversion: number;
  hipotecario: number;
  mejoraVivienda: number;
  educativo: number;
  mujeres: number;
  compraCartera: number;
  mipymes: number;
  cupoRotativo: number;
  topProduct: string;
  computedAt: string | Date;
  keywordMatches?: Record<string, string[]>;
  acierto?: Acierto;
}

interface WoopRegistro {
  montoSolicitado: number;
  plazoMeses: number;
  productoInteres: string;
  motivo: string | null;
  registradoAt: string | Date;
}

export default function ProductScorePanel({
  employee,
  score,
  bios = [],
  woopRegistro = null,
}: {
  employee: {
    edad: number;
    antiguedad: number;
    salario: number;
    hijos: number;
    genero: string;
    categoriaAfiliacion: string;
    tipoVinculacion: string;
    libranza: boolean;
    tieneCreditoVivienda: boolean;
    tieneTarjetaColsubsidio: boolean;
  };
  score: ScoreData | null;
  bios?: string[];
  woopRegistro?: WoopRegistro | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(score);

  async function handleRecalcular() {
    setLoading(true);
    try {
      const res = await fetch("/api/probabilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...employee,
          bios,
          ...(woopRegistro && {
            montoSolicitado: woopRegistro.montoSolicitado,
            plazoMeses: woopRegistro.plazoMeses,
            productoInteres: woopRegistro.productoInteres,
          }),
        }),
      });
      const data = await res.json();
      setCurrent({ ...data, computedAt: new Date().toISOString() });
      router.refresh();
    } catch {
      // el panel se queda con el ultimo valor conocido si la funcion Python no responde
    } finally {
      setLoading(false);
    }
  }

  const entries = current
    ? PRODUCT_KEYS.map((key) => ({
        key,
        label: PRODUCT_LABELS[key],
        value: current[key as keyof ScoreData] as number,
      })).sort((a, b) => b.value - a.value)
    : [];

  const topValue = current ? (current[current.topProduct as keyof ScoreData] as number) : 0;

  return (
    <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold" style={{ color: I }}>
            Probabilidad por producto de crédito
          </h2>
          {current && (
            <p className="font-data mt-0.5 text-[11px]" style={{ color: `${I}40` }}>
              Calculado el {new Date(current.computedAt).toLocaleString("es-CO")}
            </p>
          )}
        </div>
        <button
          onClick={handleRecalcular}
          disabled={loading}
          className="font-body shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}
        >
          {loading ? "Calculando..." : "Recalcular"}
        </button>
      </div>

      {woopRegistro && (
        <div className="mb-4 rounded-xl p-4" style={{ background: "#FFF8EE" }}>
          <p className="font-data text-xs font-semibold uppercase tracking-widest" style={{ color: `${I}55` }}>
            Pre-simulación declarada en Woop
          </p>
          <p className="font-data mt-1.5 text-sm" style={{ color: I }}>
            Pidió <strong>{fmt(woopRegistro.montoSolicitado)}</strong> a{" "}
            <strong>{woopRegistro.plazoMeses} meses</strong> para{" "}
            <strong>{PRODUCT_LABELS[woopRegistro.productoInteres] ?? woopRegistro.productoInteres}</strong>
            {woopRegistro.motivo && <> — &ldquo;{woopRegistro.motivo}&rdquo;</>}.
          </p>
          <p className="font-data mt-1 text-[11px]" style={{ color: `${I}45` }}>
            Registrado el {new Date(woopRegistro.registradoAt).toLocaleDateString("es-CO")}. Recalculá abajo para
            ver qué tan acertada fue esta pre-simulación frente al motor de probabilidad.
          </p>
        </div>
      )}

      {current?.keywordMatches && Object.keys(current.keywordMatches).length > 0 && (
        <p className="font-data mb-4 rounded-xl p-3 text-xs" style={{ background: "#F0F9F7", color: "#0F5F58" }}>
          🔎 Detectado en bios de redes:{" "}
          {Object.entries(current.keywordMatches)
            .map(([producto, palabras]) => `${PRODUCT_LABELS[producto] ?? producto} (${palabras.join(", ")})`)
            .join(" · ")}
        </p>
      )}

      {!current ? (
        <p className="font-data text-sm" style={{ color: `${I}40` }}>
          Todavía no se calculó la probabilidad para este colaborador.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
          <ScoreRing pct={topValue} label={PRODUCT_LABELS[current.topProduct] ?? current.topProduct} />
          <div className="flex flex-col gap-2">
            {entries.map(({ key, label, value }) => {
              const esTop = key === current.topProduct;
              const color = value >= 70 ? T : value >= 40 ? Y : R;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: esTop ? `${Y}14` : "#F7F8FC" }}
                >
                  <span style={{ fontSize: 17, lineHeight: 1 }}>{PRODUCT_ICONS[key]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span
                        className="font-data truncate"
                        style={{ color: esTop ? I : `${I}80`, fontWeight: esTop ? 700 : 500 }}
                      >
                        {label}
                        {esTop && " ⭐"}
                      </span>
                      <span className="font-data shrink-0 font-bold" style={{ color }}>
                        {value.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#E4E7EF" }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${value}%`, background: esTop ? `linear-gradient(90deg, ${Y}, ${R})` : `${I}35` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {current?.acierto && woopRegistro && (
        <div className="mt-5 grid gap-4 rounded-2xl p-5 md:grid-cols-[180px_1fr] md:items-center" style={{ background: "#F0F9F7" }}>
          <ScoreRing pct={current.acierto.porcentajeAcierto} label="% de acierto vs. Woop" />
          <div className="font-data flex flex-col justify-center gap-2 text-xs" style={{ color: I }}>
            <p>
              Qué tan cerca estuvo la pre-simulación de{" "}
              <strong>{PRODUCT_LABELS[woopRegistro.productoInteres] ?? woopRegistro.productoInteres}</strong> por{" "}
              <strong>{fmt(woopRegistro.montoSolicitado)}</strong> de lo que este recálculo predice, combinando
              similitud de producto (vector de scores vs. producto declarado) y ajuste de monto (capacidad real de
              pago vs. monto pedido).
            </p>
            <div className="flex justify-between">
              <span style={{ color: `${I}60` }}>Coincidencia de producto</span>
              <span className="font-bold">{current.acierto.similitudProducto}%</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: `${I}60` }}>Ajuste de monto pedido</span>
              <span className="font-bold">{current.acierto.ajusteMonto}%</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: `${I}60` }}>Capacidad máxima financiable (est.)</span>
              <span className="font-bold">{fmt(current.acierto.montoMaximoFinanciable)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
