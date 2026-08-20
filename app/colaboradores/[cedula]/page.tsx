import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnrichmentPanel from "@/components/EnrichmentPanel";
import KeywordSignalsPanel from "@/components/KeywordSignalsPanel";
import WoopFormPanel from "@/components/WoopFormPanel";
import RecomendacionSummaryCard from "@/components/RecomendacionSummaryCard";
import WoopLockup from "@/components/woop/WoopLockup";
import { parseWoopFormMetadata } from "@/lib/woopForm";
import { I, Y, R, T } from "@/components/woop/tokens";

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

const STATUS_COLOR: Record<string, string> = { caliente: R, tibio: Y, frio: T };

function fuenteDeSesion(session: { utmSource: string | null; referrer: string | null }): string {
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

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function ColaboradorPerfilPage({ params }: { params: { cedula: string } }) {
  const isStaff = cookies().get("h30x_staff")?.value === "1";
  if (!isStaff) redirect("/colaboradores/login");

  const employee = await prisma.employee.findUnique({
    where: { cedula: params.cedula },
    include: {
      enrichments: { orderBy: { fetchedAt: "desc" } },
      productScore: true,
      woopRegistro: true,
      linkedUser: {
        include: { sessions: true, events: { orderBy: { occurredAt: "desc" } }, intentScore: true },
      },
    },
  });

  if (!employee) notFound();

  const linkedUser = employee.linkedUser;
  const status = linkedUser?.intentScore?.leadStatus ?? "frio";
  const score = linkedUser?.intentScore?.currentScore ?? 0;

  // Evento mas relevante para mostrar "lo que lleno en el formulario de Woop":
  // se prioriza contact_request (tiene toda la data + intencion explicita de
  // contacto), si no hay se cae a simulator_use/form_complete.
  const eventosForm =
    linkedUser?.events.filter((e) =>
      ["contact_request", "simulator_use", "form_complete"].includes(e.eventType)
    ) ?? [];
  const eventoContacto = eventosForm.find((e) => e.eventType === "contact_request");
  const eventoFormRelevante =
    eventoContacto ??
    eventosForm.find((e) => e.eventType === "simulator_use") ??
    eventosForm.find((e) => e.eventType === "form_complete");
  const woopFormData = parseWoopFormMetadata(eventoFormRelevante?.metadata);
  const tieneFormWoop = Boolean(woopFormData);

  const topProduct = employee.productScore?.topProduct ?? null;
  const topValue =
    topProduct && employee.productScore
      ? ((employee.productScore as unknown as Record<string, number>)[topProduct] ?? null)
      : null;

  const cuotaMaxima = Math.round(employee.salario * 0.3);
  const iniciales = employee.nombre
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");

  return (
    <main className="min-h-screen font-body" style={{ background: "#F0F2F8" }}>
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <WoopLockup size="sm" />
          <Link href="/colaboradores" className="font-data text-sm" style={{ color: `${I}60` }}>
            ← Volver a la búsqueda
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Identidad */}
        <div className="mb-5 flex items-center gap-4 rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${Y}, ${R})`, fontSize: 20 }}
          >
            {iniciales}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold" style={{ color: I }}>{employee.nombre}</h1>
            <p className="font-data text-sm" style={{ color: `${I}55` }}>{employee.rol} · {employee.empresa}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {linkedUser && (
              <span
                className="font-data rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: `${STATUS_COLOR[status]}18`, color: STATUS_COLOR[status] }}
              >
                Lead {status} · score {score}
              </span>
            )}
            <span
              className="font-data rounded-full px-3 py-1.5 text-xs font-semibold"
              style={
                tieneFormWoop
                  ? { background: `${T}18`, color: T }
                  : { background: "#EEF0F6", color: `${I}55` }
              }
            >
              {tieneFormWoop ? "📝 Llenó el formulario Woop" : "🔍 Prospecto"}
            </span>
          </div>
        </div>

        {!tieneFormWoop && (
          <div className="mb-5">
            <RecomendacionSummaryCard cedula={employee.cedula} topProduct={topProduct} topValue={topValue} />
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-[280px_1fr]">
          {/* Columna izquierda */}
          <div className="flex flex-col gap-5">
            <div className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
              <div className="font-data mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: `${I}45` }}>
                Datos del colaborador
              </div>
              {[
                ["Cédula", employee.cedula],
                ["Correo", employee.correo],
                ["Edad", `${employee.edad} años`],
                ["Antigüedad", `${employee.antiguedad} años`],
                ["Hijos", String(employee.hijos)],
                ["Género", employee.genero],
                ["Categoría afiliación", employee.categoriaAfiliacion],
                ["Vinculación", employee.tipoVinculacion],
                ["Salario", fmt(employee.salario)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${I}08` }}>
                  <span className="font-data text-xs" style={{ color: `${I}55` }}>{l}</span>
                  <span className="font-data text-xs font-semibold" style={{ color: I }}>{v}</span>
                </div>
              ))}
              <p className="font-data mt-3 text-[11px]" style={{ color: `${I}35` }}>
                Datos 100% sintéticos generados para esta demo.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
              <div className="font-data mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: `${I}45` }}>
                Capacidad de endeudamiento (estimada)
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-data" style={{ color: `${I}65` }}>Ingreso mensual</span>
                <span className="font-display font-bold" style={{ color: I }}>{fmt(employee.salario)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="font-data" style={{ color: `${I}65` }}>Cuota máxima recomendada</span>
                <span className="font-display font-bold" style={{ color: T }}>{fmt(cuotaMaxima)}</span>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full" style={{ background: "#E4E7EF" }}>
                <div className="h-3 rounded-full" style={{ width: "30%", background: `linear-gradient(90deg, ${T}, ${Y})` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: `${I}45` }}>
                <span className="font-data">30% cuota</span>
                <span className="font-data">70% resto del ingreso</span>
              </div>
              <p className="font-data mt-3 text-[11px]" style={{ color: `${I}35` }}>
                Estimación simple (30% del ingreso), no un cálculo de capacidad real de endeudamiento.
              </p>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-5">
            {tieneFormWoop && linkedUser && (
              <WoopFormPanel
                userId={linkedUser.id}
                formData={woopFormData}
                solicitoContacto={Boolean(eventoContacto)}
                fechaSolicitud={eventoContacto?.occurredAt ?? null}
                contactadoPorAsesor={linkedUser.contactadoPorAsesor}
                contactadoAt={linkedUser.contactadoAt}
                empleadoCorreo={employee.correo}
              />
            )}

            <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
              <h2 className="font-display text-lg font-bold" style={{ color: I }}>
                Actividad en colsubsidio.com/creditos
              </h2>
              {!linkedUser ? (
                <p className="font-data mt-3 text-sm" style={{ color: `${I}40` }}>
                  No se detectó actividad de este colaborador en el sitio de créditos.
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {linkedUser.sessions.map((s) => (
                      <span
                        key={s.id}
                        className="font-data rounded-full px-3 py-1 text-xs"
                        style={{ background: "#F7F8FC", color: `${I}70` }}
                      >
                        {new Date(s.startedAt).toLocaleDateString("es-CO")} · {fuenteDeSesion(s)} · {s.deviceType}
                      </span>
                    ))}
                  </div>
                  <ol className="mt-4 space-y-2">
                    {linkedUser.events.map((event) => (
                      <li key={event.id} className="rounded-xl p-3 text-sm" style={{ background: "#F7F8FC" }}>
                        <div className="flex items-center justify-between">
                          <span className="font-data font-semibold" style={{ color: I }}>
                            {EVENT_LABELS[event.eventType] ?? event.eventType}
                          </span>
                          <span className="font-data text-xs" style={{ color: `${I}40` }}>
                            {new Date(event.occurredAt).toLocaleString("es-CO")}
                          </span>
                        </div>
                        {event.searchTerm && (
                          <p className="font-data text-xs" style={{ color: `${I}60` }}>Búsqueda: &ldquo;{event.searchTerm}&rdquo;</p>
                        )}
                        {event.elementClicked && (
                          <p className="font-data text-xs" style={{ color: `${I}60` }}>Elemento: {event.elementClicked}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>

            <EnrichmentPanel cedula={employee.cedula} enrichments={employee.enrichments} />
            <KeywordSignalsPanel
              enrichments={employee.enrichments.map((e) => ({ provider: e.provider, bio: e.bio }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
