const MOOD_SRC: Record<string, string> = {
  default: "/woop/beaver-default.png",
  thinking: "/woop/beaver-thinking.png",
  celebrating: "/woop/beaver-celebrating.png",
  wave: "/woop/beaver-wave.png",
  money: "/woop/beaver-money.png",
};

export default function WoopyMascot({
  size = 120,
  mood = "default",
}: {
  size?: number;
  mood?: "default" | "celebrating" | "thinking" | "wave" | "money";
}) {
  const animClass = mood === "celebrating" ? "animate-bounce" : "animate-float";
  const h = Math.round(size * 1.18);

  return (
    <div className={animClass} style={{ width: size, height: h, flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MOOD_SRC[mood] ?? MOOD_SRC.default}
        alt="Castor Woop"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
