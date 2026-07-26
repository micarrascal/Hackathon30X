const Y = "#FFC629";
const R = "#FF6B4A";
const T = "#17A398";
const I = "#16294D";

export default function Btn({
  children,
  onClick,
  type = "button",
  disabled = false,
  v = "primary",
  full = false,
  sm = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  v?: "primary" | "ghost" | "outline" | "teal";
  full?: boolean;
  sm?: boolean;
}) {
  const base = `font-body font-semibold rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
    sm ? "text-xs px-4 py-2.5" : "text-sm px-6 py-4"
  } ${full ? "w-full" : ""}`;

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, ${Y} 0%, ${R} 100%)`,
      color: "white",
      boxShadow: `0 8px 24px rgba(255,107,74,0.32)`,
    },
    ghost: {
      background: "rgba(255,255,255,0.12)",
      color: "white",
      border: "1.5px solid rgba(255,255,255,0.18)",
    },
    outline: { background: "transparent", color: I, border: `1.5px solid ${I}20` },
    teal: { background: T, color: "white", boxShadow: `0 8px 24px rgba(23,163,152,0.3)` },
  };

  return (
    <button type={type} disabled={disabled} className={base} style={styles[v]} onClick={onClick}>
      {children}
    </button>
  );
}
