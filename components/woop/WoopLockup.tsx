export default function WoopLockup({
  light = false,
  size = "md",
}: {
  light?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sz = {
    sm: ["text-xl", "text-xs"],
    md: ["text-3xl", "text-xs"],
    lg: ["text-5xl", "text-sm"],
  }[size];

  return (
    <div className="flex flex-col items-center leading-none">
      <div
        className={`font-display font-extrabold tracking-tight ${sz[0]}`}
        style={{ color: light ? "#FFC629" : "#16294D" }}
      >
        <span style={{ color: "#FFC629" }}>W</span>oop
      </div>
      {size !== "sm" && (
        <div
          className={`font-data tracking-widest uppercase ${sz[1]} mt-0.5`}
          style={{ color: light ? "rgba(255,255,255,0.45)" : "#16294D60" }}
        >
          un servicio de Colsubsidio
        </div>
      )}
    </div>
  );
}
