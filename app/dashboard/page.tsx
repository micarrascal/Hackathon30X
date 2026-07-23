import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  caliente: "bg-red-100 text-red-700 border-red-200",
  tibio: "bg-yellow-100 text-yellow-700 border-yellow-200",
  frio: "bg-green-100 text-green-700 border-green-200",
};

export default async function DashboardPage() {
  const users = await prisma.user.findMany({
    include: {
      intentScore: true,
      _count: { select: { events: true } },
    },
  });

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
        <Link href="/creditos" className="text-sm text-brand-600 hover:text-brand-800">
          ← Ir al sitio público
        </Link>
      </div>

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
                      className="font-medium text-brand-700 hover:underline"
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
