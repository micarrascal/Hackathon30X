"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_LABELS } from "@/lib/product-scoring";

interface ScoreData {
  cupoCredito: number;
  consumo: number;
  vivienda: number;
  mujeres: number;
  educativo: number;
  topProduct: string;
  computedAt: string | Date;
}

export default function ProductScorePanel({
  cedula,
  score,
}: {
  cedula: string;
  score: ScoreData | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRecalcular() {
    setLoading(true);
    try {
      await fetch("/api/colaboradores/recalcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const entries = score
    ? (Object.keys(PRODUCT_LABELS) as (keyof typeof PRODUCT_LABELS)[])
        .map((key) => ({ key, label: PRODUCT_LABELS[key], value: score[key as keyof ScoreData] as number }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Probabilidad por producto de crédito</h2>
        <button
          onClick={handleRecalcular}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Calculando..." : "Recalcular"}
        </button>
      </div>

      {!score ? (
        <p className="mt-4 text-sm text-gray-400">
          Todavía no se calculó la probabilidad para este colaborador.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map(({ key, label, value }) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span
                  className={
                    key === score.topProduct
                      ? "font-bold text-brand-700"
                      : "font-medium text-gray-700"
                  }
                >
                  {label}
                  {key === score.topProduct && " ⭐"}
                </span>
                <span className="text-gray-500">{value.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={key === score.topProduct ? "h-2 bg-accent-500" : "h-2 bg-brand-500/50"}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
          <p className="pt-2 text-xs text-gray-400">
            Calculado el {new Date(score.computedAt).toLocaleString("es-CO")} · reglas
            determinísticas, no generado por IA.
          </p>
        </div>
      )}
    </section>
  );
}
