const Y = "#FFC629";
const R = "#FF6B4A";
const T = "#17A398";
const I = "#16294D";

export default function PayGauge({ pct = 83, label = "Probabilidad de pago" }: { pct?: number; label?: string }) {
  const cx = 100,
    cy = 112,
    r = 86;
  const pp = Math.min(100, Math.max(0, pct)) / 100;
  const theta = pp * Math.PI;
  const nx = +(cx - r * Math.cos(theta)).toFixed(2);
  const ny = +(cy - r * Math.sin(theta)).toFixed(2);
  const la = pp > 0.5 ? 1 : 0;

  // Todo (arco, aguja y textos) vive dentro del mismo viewBox SVG para que
  // escale de forma proporcional sin importar el ancho del contenedor —
  // un overlay HTML posicionado con "bottom: Npx" se desalinea si el SVG
  // se estira mas ancho/alto de lo previsto (ver bugfix).
  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={R} />
          <stop offset="45%" stopColor={Y} />
          <stop offset="100%" stopColor={T} />
        </linearGradient>
      </defs>
      <path d="M 14 112 A 86 86 0 0 1 186 112" fill="none" stroke="#E4E7EF" strokeWidth="14" strokeLinecap="round" />
      {pp > 0.01 && (
        <path
          d={`M 14 112 A 86 86 0 ${la} 1 ${nx} ${ny}`}
          fill="none"
          stroke="url(#pg)"
          strokeWidth="14"
          strokeLinecap="round"
        />
      )}
      <line x1={cx} y1={cy + 8} x2={nx} y2={ny} stroke={I} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy + 8} r="5.5" fill={I} />
      <circle cx={cx} cy={cy + 8} r="2.5" fill="white" />

      <text x="14" y="106" fontSize="9" fill={R} fontFamily="Inter, sans-serif" textAnchor="middle">Bajo</text>
      <text x={cx} y="20" fontSize="9" fill={Y} fontFamily="Inter, sans-serif" textAnchor="middle">Medio</text>
      <text x="186" y="106" fontSize="9" fill={T} fontFamily="Inter, sans-serif" textAnchor="middle">Alto</text>

      <text
        x={cx}
        y="140"
        fontSize="30"
        fontWeight="800"
        fill={I}
        fontFamily="Sora, sans-serif"
        textAnchor="middle"
      >
        {Math.round(pct)}%
      </text>
      <text
        x={cx}
        y="154"
        fontSize="9"
        fill={`${I}90`}
        fontFamily="Inter, sans-serif"
        textAnchor="middle"
      >
        {label}
      </text>
    </svg>
  );
}
