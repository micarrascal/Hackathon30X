"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EnrichmentRow {
  id: string;
  provider: string;
  matchedUsername: string | null;
  matchedFullName: string | null;
  bio: string | null;
  followers: number | null;
  profileUrl: string | null;
  fetchedAt: string | Date;
}

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
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Enriquecimiento de redes sociales</h2>
        <button
          onClick={handleBuscar}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Buscar en redes"}
        </button>
      </div>

      <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
        ⚠️ Estos resultados son coincidencias por nombre en redes públicas (vía EnsembleData),{" "}
        <strong>no son una identidad verificada</strong>. Pueden corresponder a otra persona con el
        mismo nombre.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {enrichments.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          Todavía no se buscó en redes para este colaborador.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {enrichments.map((e) => (
            <div key={e.id} className="rounded-lg border border-gray-200 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-brand-600">{e.provider}</p>
              {e.matchedUsername ? (
                <>
                  <p className="font-semibold text-gray-900">
                    {e.matchedFullName ?? e.matchedUsername}{" "}
                    <span className="font-normal text-gray-400">@{e.matchedUsername}</span>
                  </p>
                  {e.bio && <p className="mt-1 text-gray-600">{e.bio}</p>}
                  {e.followers !== null && (
                    <p className="mt-1 text-gray-500">
                      {e.followers.toLocaleString("es-CO")} seguidores
                    </p>
                  )}
                  {e.profileUrl && (
                    <a
                      href={e.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-brand-600 hover:underline"
                    >
                      Ver perfil ↗
                    </a>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Sin coincidencias.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
