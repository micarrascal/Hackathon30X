"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PayGauge from "@/components/woop/PayGauge";
import { I, Y, R, T } from "@/components/woop/tokens";

const PRODUCT_LABELS: Record<string, string> = {
  libreInversion: "Libre inversión",
  hipotecario: "Hipotecario",
  mejoraVivienda: "Mejora de vivienda",
  educativo: "Educativo",
  mujeres: "Línea Mujer",
  compraCartera: "Compra de cartera",
  mipymes: "MiPymes",
  cupoRotativo: "Cupo rotativo",
};

const PRODUCT_KEYS = Object.keys(PRODUCT_LABELS);

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
}

export default function ProductScorePanel({
  employee,
  score,
  bios = [],
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
        body: JSON.stringify({ ...employee, bios }),
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold" style={{ color: I }}>
          Probabilidad por producto de crédito
        </h2>
        <button
          onClick={handleRecalcular}
          disabled={loading}
          className="font-body rounded-xl px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}
        >
          {loading ? "Calculando..." : "Recalcular"}
        </button>
      </div>

      <p className="font-data mb-4 rounded-xl bg-yellow-50 p-3 text-xs" style={{ color: "#7A5E00" }}>
        ⚠️ Calculado por reglas deterministas en Python (<code>api/probabilidad.py</code>), sin
        IA, a partir de los requisitos reales de cada línea de crédito. No es un score de
        buró real.
      </p>

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
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <PayGauge pct={topValue} label={PRODUCT_LABELS[current.topProduct] ?? current.topProduct} />
          </div>
          <div className="flex flex-col justify-center gap-3">
            {entries.map(({ key, label, value }) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span
                    className="font-data"
                    style={{ color: key === current.topProduct ? I : `${I}80`, fontWeight: key === current.topProduct ? 700 : 500 }}
                  >
                    {label}
                    {key === current.topProduct && " ⭐"}
                  </span>
                  <span className="font-data" style={{ color: value >= 70 ? T : value >= 40 ? Y : R }}>
                    {value.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "#E4E7EF" }}>
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${value}%`, background: key === current.topProduct ? `linear-gradient(90deg, ${Y}, ${R})` : `${I}40` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {current && (
        <p className="font-data mt-4 text-xs" style={{ color: `${I}40` }}>
          Calculado el {new Date(current.computedAt).toLocaleString("es-CO")}
        </p>
      )}
    </section>
  );
}
