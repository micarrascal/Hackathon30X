import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  caliente: "bg-red-100 text-red-700 border-red-200",
  tibio: "bg-yellow-100 text-yellow-700 border-yellow-200",
  frio: "bg-green-100 text-green-700 border-green-200",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

interface ContactoMetadata {
  nombre?: string;
  cedula?: string;
  empresa?: string;
  celular?: string;
  proposito?: string;
  monto?: number;
  plazoMeses?: number;
  cuotaMensual?: number;
  ingresoMensual?: number;
}

export default async function DashboardPage() {
  const [users, contactos] = await Promise.all([
    prisma.user.findMany({
      include: {
        intentScore: true,
        _count: { select: { events: true } },
      },
    }),
    prisma.event.findMany({
      where: { eventType: "contact_request" },
      orderBy: { occurredAt: "desc" },
      include: { user: { include: { intentScore: true } } },
    }),
  ]);

  const sorted = users.sort(
    (a, b) => (b.intentScore?.currentScore ?? 0) - (a.intentScore?.currentScore ?? 0)
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de leads</h1>
          <p className="text-sm text-gray-500">
            Usuarios ordenados por intent score. Demo interno — sin autenticación real.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/colaboradores" className="hover:opacity-70" style={{ color: "#17A398" }}>
            Portal colaboradores →
          </Link>
          <Link href="/creditos" className="hover:opacity-70" style={{ color: "#17A398" }}>
            ← Ir al sitio público
          </Link>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-xl border-2 border-red-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-red-700">
            📞 Leads interesados en ser contactados ({contactos.length})
          </h2>
        </div>
        {contactos.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            Todavía nadie pidió ser contactado desde el simulador.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Celular</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Monto / plazo</th>
                <th className="px-4 py-3">Cuota est.</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Solicitado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contactos.map((evento) => {
                let meta: ContactoMetadata = {};
                try {
                  meta = evento.metadata ? JSON.parse(evento.metadata) : {};
                } catch {
                  meta = {};
                }
                const status = evento.user.intentScore?.leadStatus ?? "frio";
                return (
                  <tr key={evento.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/${evento.userId}`}
                        className="font-semibold hover:underline"
                        style={{ color: "#16294D" }}
                      >
                        {meta.nombre || "(sin nombre)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{meta.cedula || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{meta.celular || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{meta.empresa || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {meta.monto ? fmt(meta.monto) : "—"}
                      {meta.plazoMeses ? ` · ${meta.plazoMeses} meses` : ""}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {meta.cuotaMensual ? fmt(meta.cuotaMensual) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(evento.occurredAt).toLocaleString("es-CO")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Todos los leads
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Eventos</th>
              <th className="px-4 py-3">Última visita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((user) => {
              const status = user.intentScore?.leadStatus ?? "frio";
              const score = user.intentScore?.currentScore ?? 0;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/${user.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "#16294D" }}
                    >
                      {user.email ?? user.cookieId.slice(0, 12)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold">{score}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user._count.events}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.lastSeenAt).toLocaleString("es-CO")}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Todavía no hay usuarios. Corré <code>npm run seed</code> para generar datos de
                  ejemplo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
