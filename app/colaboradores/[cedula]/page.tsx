import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnrichmentPanel from "@/components/EnrichmentPanel";
import ProductScorePanel from "@/components/ProductScorePanel";

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
};

const STATUS_STYLES: Record<string, string> = {
  caliente: "bg-red-100 text-red-700 border-red-200",
  tibio: "bg-yellow-100 text-yellow-700 border-yellow-200",
  frio: "bg-green-100 text-green-700 border-green-200",
};

function fuenteDeSesion(session: {
  utmSource: string | null;
  utmMedium: string | null;
  referrer: string | null;
}): string {
  const source = session.utmSource?.toLowerCase();
  if (source === "facebook") return "Anuncio de Facebook";
  if (source === "instagram") return "Anuncio de Instagram";
  if (source === "google") return "Búsqueda / anuncio de Google";
  if (source === "newsletter") return "Newsletter";
  const referrer = session.referrer?.toLowerCase() ?? "";
  if (referrer.includes("facebook")) return "Red social (Facebook)";
  if (referrer.includes("instagram")) return "Red social (Instagram)";
  if (referrer) return "Referido externo";
  return "Orgánico / directo";
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function ColaboradorPerfilPage({
  params,
}: {
  params: { cedula: string };
}) {
  const isStaff = cookies().get("h30x_staff")?.value === "1";
  if (!isStaff) redirect("/colaboradores/login");

  const employee = await prisma.employee.findUnique({
    where: { cedula: params.cedula },
    include: {
      enrichments: { orderBy: { fetchedAt: "desc" } },
      productScore: true,
      linkedUser: {
        include: {
          sessions: true,
          events: { orderBy: { occurredAt: "desc" } },
          intentScore: true,
        },
      },
    },
  });

  if (!employee) notFound();

  const linkedUser = employee.linkedUser;
  const status = linkedUser?.intentScore?.leadStatus ?? "frio";
  const score = linkedUser?.intentScore?.currentScore ?? 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/colaboradores" className="text-sm text-brand-600 hover:text-brand-800">
        ← Volver a la búsqueda
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{employee.nombre}</h1>
            <p className="text-sm text-gray-500">
              {employee.rol} · {employee.empresa}
            </p>
          </div>
          {linkedUser && (
            <span
              className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
            >
              Lead {status} · score {score}
            </span>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-400">Cédula</dt>
            <dd className="font-medium text-gray-900">{employee.cedula}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Correo</dt>
            <dd className="font-medium text-gray-900">{employee.correo}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Edad</dt>
            <dd className="font-medium text-gray-900">{employee.edad} años</dd>
          </div>
          <div>
            <dt className="text-gray-400">Antigüedad</dt>
            <dd className="font-medium text-gray-900">{employee.antiguedad} años</dd>
          </div>
          <div>
            <dt className="text-gray-400">Hijos</dt>
            <dd className="font-medium text-gray-900">{employee.hijos}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Género</dt>
            <dd className="font-medium text-gray-900">{employee.genero}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Salario</dt>
            <dd className="font-medium text-gray-900">{formatCurrency(employee.salario)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-gray-400">
          Datos de empleado 100% sintéticos, generados para esta demo — no corresponden a una
          persona real.
        </p>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Actividad en colsubsidio.com/creditos
        </h2>
        {!linkedUser ? (
          <p className="mt-3 text-sm text-gray-400">
            No se detectó actividad de este colaborador en el sitio de créditos.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {linkedUser.sessions.map((s) => (
                <span
                  key={s.id}
                  className="inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600"
                >
                  {new Date(s.startedAt).toLocaleDateString("es-CO")} · {fuenteDeSesion(s)} ·{" "}
                  {s.deviceType}
                </span>
              ))}
            </div>
            <ol className="mt-4 space-y-2">
              {linkedUser.events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {EVENT_LABELS[event.eventType] ?? event.eventType}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(event.occurredAt).toLocaleString("es-CO")}
                    </span>
                  </div>
                  {event.searchTerm && (
                    <p className="text-gray-500">Búsqueda: "{event.searchTerm}"</p>
                  )}
                  {event.elementClicked && (
                    <p className="text-gray-500">Elemento: {event.elementClicked}</p>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <div className="mt-6">
        <EnrichmentPanel cedula={employee.cedula} enrichments={employee.enrichments} />
      </div>

      <div className="mt-6">
        <ProductScorePanel cedula={employee.cedula} score={employee.productScore} />
      </div>
    </main>
  );
}
