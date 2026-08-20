import { I, Y, R, T } from "@/components/woop/tokens";

// Anillo de progreso con conic-gradient puro en CSS — reemplaza al gauge dibujado
// a mano con paths SVG (PayGauge), que tenia un bug real: el large-arc-flag se
// activaba mal para valores >50% y dibujaba el arco por el lado equivocado del
// circulo, generando formas rotas. conic-gradient no tiene esa clase de bug
// (es solo dos stops de color) y es mucho mas simple de mantener.
export default function ScoreRing({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 70 ? T : clamped >= 40 ? Y : R;

  return (
    <div
      className="mx-auto flex h-40 w-40 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} ${clamped}%, #E4E7EF 0)` }}
    >
      <div className="flex h-[124px] w-[124px] flex-col items-center justify-center rounded-full bg-white text-center">
        <span className="font-display text-3xl font-extrabold" style={{ color: I }}>
          {Math.round(clamped)}%
        </span>
        <span className="font-data mt-0.5 px-2 text-xs font-semibold leading-tight" style={{ color: `${I}70` }}>
          {label}
        </span>
      </div>
    </div>
  );
}
