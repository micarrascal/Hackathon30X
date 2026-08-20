import Link from "next/link";
import { PRODUCT_LABELS, PRODUCT_ICONS } from "@/lib/creditProducts";
import { Y, R } from "@/components/woop/tokens";

export default function RecomendacionSummaryCard({
  cedula,
  topProduct,
  topValue,
}: {
  cedula: string;
  topProduct: string | null;
  topValue: number | null;
}) {
  return (
    <Link
      href={`/colaboradores/${cedula}/recomendacion`}
      className="flex items-center justify-between gap-4 rounded-3xl p-6 transition hover:opacity-95"
      style={{ background: "linear-gradient(135deg, #16294D, #1A3A7A)" }}
    >
      <div className="min-w-0">
        <p className="font-data text-xs uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
          Recomendación de producto
        </p>
        <p className="font-display mt-1 truncate text-xl font-extrabold text-white">
          {topProduct ? (
            <>
              {PRODUCT_ICONS[topProduct]} {PRODUCT_LABELS[topProduct] ?? topProduct}
              {topValue !== null && <span className="font-body text-base font-semibold"> · {topValue.toFixed(0)}%</span>}
            </>
          ) : (
            "Sin calcular todavía"
          )}
        </p>
      </div>
      <span
        className="font-body shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}
      >
        Ver recomendación →
      </span>
    </Link>
  );
}
