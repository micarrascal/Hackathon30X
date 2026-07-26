import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  page_view: "Vista de página",
  search: "Búsqueda",
  click: "Click",
  simulator_use: "Uso del simulador",
  form_start: "Inicio de formulario",
  form_abandon: "Abandono de formulario",
  form_complete: "Formulario completado",
  chatbot_simulacion: "Simulación por chatbot",
  contact_request: "📞 Pidió ser contactado",
};

const STATUS_STYLES: Record<string, string> = {
  caliente: "bg-red-100 text-red-700 border-red-200",
  tibio: "bg-yellow-100 text-yellow-700 border-yellow-200",
  frio: "bg-green-100 text-green-700 border-green-200",
};

export default async function UserTimelinePage({
  params,
}: {
  params: { userId: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      intentScore: true,
      sessions: true,
      events: { orderBy: { occurredAt: "desc" } },
    },
  });

  if (!user) notFound();

  const status = user.intentScore?.leadStatus ?? "frio";
  const score = user.intentScore?.currentScore ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard" className="text-sm hover:opacity-70" style={{ color: "#17A398" }}>
        ← Volver al panel
      </Link>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {user.email ?? `Usuario ${user.cookieId.slice(0, 12)}`}
          </h1>
          <p className="text-sm text-gray-500">
            Primera visita: {new Date(user.firstSeenAt).toLocaleString("es-CO")} · Última visita:{" "}
            {new Date(user.lastSeenAt).toLocaleString("es-CO")}
          </p>
          <p className="text-sm text-gray-500">Sesiones: {user.sessions.length}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{score}</p>
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
          >
            {status}
          </span>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-gray-800">Timeline de eventos</h2>
      <ol className="space-y-3">
        {user.events.map((event) => (
          <li
            key={event.id}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {EVENT_LABELS[event.eventType] ?? event.eventType}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(event.occurredAt).toLocaleString("es-CO")}
              </span>
            </div>
            {event.pageUrl && <p className="text-gray-500">Página: {event.pageUrl}</p>}
            {event.searchTerm && <p className="text-gray-500">Búsqueda: “{event.searchTerm}”</p>}
            {event.elementClicked && (
              <p className="text-gray-500">Elemento: {event.elementClicked}</p>
            )}
            {event.metadata && (
              <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                {JSON.stringify(JSON.parse(event.metadata), null, 2)}
              </pre>
            )}
          </li>
        ))}
        {user.events.length === 0 && (
          <p className="text-sm text-gray-400">Este usuario todavía no tiene eventos.</p>
        )}
      </ol>
    </main>
  );
}
