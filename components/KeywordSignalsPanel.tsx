import { detectarKeywords, PRODUCT_LABELS } from "@/lib/keywordSignals";
import { I, T, Y } from "@/components/woop/tokens";

const PROVIDER_ICON: Record<string, string> = { instagram: "📸", tiktok: "🎵" };

interface BioEntry {
  provider: string;
  bio: string | null;
}

export default function KeywordSignalsPanel({ enrichments }: { enrichments: BioEntry[] }) {
  const bios = enrichments.map((e) => e.bio);
  const matches = detectarKeywords(bios);
  const productos = Object.keys(matches);
  const bioEntries = enrichments.filter((e): e is BioEntry & { bio: string } => Boolean(e.bio));

  if (bioEntries.length === 0) return null;

  return (
    <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
      <h2 className="font-display text-lg font-bold" style={{ color: I }}>
        Palabras clave detectadas en redes
      </h2>
      <p className="font-data mt-1 text-xs" style={{ color: `${I}55` }}>
        Rastreo automático de las bios encontradas en redes públicas, cruzadas contra las líneas de
        crédito de Colsubsidio.
      </p>

      {productos.length === 0 ? (
        <p className="font-data mt-4 text-sm" style={{ color: `${I}40` }}>
          No se encontraron palabras clave de nuestro diccionario en estas bios — igual las dejamos
          abajo para que las revises con tu propio criterio.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {productos.map((producto) => (
            <div key={producto} className="rounded-2xl p-3.5" style={{ background: "#F7F8FC" }}>
              <div className="flex items-center justify-between">
                <span className="font-data text-sm font-bold" style={{ color: I }}>
                  {PRODUCT_LABELS[producto] ?? producto}
                </span>
                <span
                  className="font-data rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${T}18`, color: T }}
                >
                  {matches[producto].length} match{matches[producto].length > 1 ? "es" : ""}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matches[producto].map((palabra) => (
                  <span
                    key={palabra}
                    className="font-data rounded-full px-2.5 py-1 text-xs"
                    style={{ background: `${Y}20`, color: "#7A5E00" }}
                  >
                    {palabra}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t pt-3.5" style={{ borderColor: `${I}0C` }}>
        <p className="font-data mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: `${I}40` }}>
          Bios rastreadas
        </p>
        <div className="flex flex-col gap-2">
          {bioEntries.map((e, i) => (
            <p key={i} className="font-data flex items-start gap-2 rounded-xl p-2.5 text-xs" style={{ background: "#FAFBFD", color: `${I}70` }}>
              <span className="shrink-0">{PROVIDER_ICON[e.provider] ?? "🔗"}</span>
              <span>{e.bio}</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
