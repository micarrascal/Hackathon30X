"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { I, T, R } from "@/components/woop/tokens";

interface EnrichmentRow {
  id: string;
  provider: string;
  source: string;
  matchedUsername: string | null;
  matchedFullName: string | null;
  bio: string | null;
  followers: number | null;
  verified: boolean | null;
  engagementRate: number | null;
  profileUrl: string | null;
  fetchedAt: string | Date;
}

const PROVIDER_ICON: Record<string, string> = { instagram: "📸", tiktok: "🎵" };

export default function EnrichmentPanel({
  cedula,
  enrichments,
}: {
  cedula: string;
  enrichments: EnrichmentRow[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuscar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/colaboradores/enriquecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo buscar en redes.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión al buscar en redes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold" style={{ color: I }}>
          Presencia en redes sociales
        </h2>
        <button
          onClick={handleBuscar}
          disabled={loading}
          className="font-body rounded-xl px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
          style={{ background: I }}
        >
          {loading ? "Buscando..." : "Buscar en redes"}
        </button>
      </div>

      {error && <p className="font-data mb-3 text-sm text-red-600">{error}</p>}

      {enrichments.length === 0 ? (
        <p className="font-data text-sm" style={{ color: `${I}40` }}>
          Todavía no se buscó en redes para este colaborador.
        </p>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {enrichments.map((e) => (
            <div key={e.id} className="rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
              <div className="mb-3 flex items-center gap-2">
                <span style={{ fontSize: 20 }}>{PROVIDER_ICON[e.provider] ?? "🔗"}</span>
                <span className="font-data text-sm font-bold" style={{ color: I }}>{e.provider}</span>
                {e.verified && (
                  <span className="ml-auto text-sm" style={{ color: T }} title="Cuenta verificada">✔ verificada</span>
                )}
              </div>
              {e.matchedUsername ? (
                <>
                  <p className="font-data text-sm font-semibold" style={{ color: I }}>
                    {e.matchedFullName ?? e.matchedUsername}{" "}
                    <span className="font-normal" style={{ color: `${I}45` }}>@{e.matchedUsername}</span>
                  </p>
                  {e.source === "simulado" && (
                    <p
                      className="font-data mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${R}18`, color: R }}
                    >
                      ⚠️ Simulado — EnsembleData sin suscripción activa
                    </p>
                  )}
                  {e.bio && (
                    <p className="font-data mt-1 text-xs" style={{ color: `${I}70` }}>{e.bio}</p>
                  )}
                  <div className="font-data mt-2 flex justify-between text-xs" style={{ color: `${I}55` }}>
                    <span>Seguidores</span>
                    <span className="font-bold" style={{ color: I }}>
                      {e.followers !== null ? e.followers.toLocaleString("es-CO") : "—"}
                    </span>
                  </div>
                  {e.engagementRate !== null && (
                    <div className="font-data mt-1 flex justify-between text-xs" style={{ color: `${I}55` }}>
                      <span>Engagement</span>
                      <span className="font-bold" style={{ color: T }}>{(e.engagementRate * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  <p className="font-data mt-2 text-[10px] uppercase tracking-wide" style={{ color: `${I}35` }}>
                    Fuente:{" "}
                    {e.source === "ensembledata+socialcrawl"
                      ? "EnsembleData + SocialCrawl"
                      : e.source === "simulado"
                        ? "Datos simulados (fallback)"
                        : "EnsembleData"}
                  </p>
                  {e.profileUrl && (
                    <a
                      href={e.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-data mt-1 inline-block text-xs font-semibold hover:underline"
                      style={{ color: T }}
                    >
                      Ver perfil ↗
                    </a>
                  )}
                </>
              ) : (
                <p className="font-data text-xs" style={{ color: `${I}40` }}>Sin coincidencias.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
