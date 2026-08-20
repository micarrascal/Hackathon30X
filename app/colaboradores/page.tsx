import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SearchByCedula from "@/components/SearchByCedula";
import WoopyMascot from "@/components/woop/WoopyMascot";
import WoopLockup from "@/components/woop/WoopLockup";
import { parseWoopFormMetadata, PROPOSITO_LABELS } from "@/lib/woopForm";
import { PRODUCT_LABELS } from "@/lib/creditProducts";
import { I, T, Y, R } from "@/components/woop/tokens";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = { caliente: R, tibio: Y, frio: T };

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function ColaboradoresPage() {
  const isStaff = cookies().get("h30x_staff")?.value === "1";
  if (!isStaff) redirect("/colaboradores/login");

  const [employees, contactRequests, formEvents] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { nombre: "asc" },
      include: { linkedUser: true },
    }),
    prisma.event.findMany({
      where: { eventType: "contact_request", user: { employee: { isNot: null } } },
      orderBy: { occurredAt: "desc" },
      include: { user: { include: { employee: { include: { productScore: true } }, intentScore: true } } },
    }),
    prisma.event.findMany({
      where: { eventType: { in: ["form_complete", "simulator_use"] }, user: { employee: { isNot: null } } },
      orderBy: { occurredAt: "desc" },
      include: { user: { include: { employee: { include: { productScore: true } }, intentScore: true } } },
    }),
  ]);

  // Un colaborador puede haber pedido contacto mas de una vez — nos quedamos con
  // la mas reciente por colaborador (contactRequests ya viene ordenado desc).
  const interesadosVistos = new Set<string>();
  const interesados = contactRequests.filter((evento) => {
    const empleadoId = evento.user.employee?.id;
    if (!empleadoId || interesadosVistos.has(empleadoId)) return false;
    interesadosVistos.add(empleadoId);
    return true;
  });

  // Colaboradores que completaron el simulador pero todavia NO pidieron ser
  // contactados explicitamente — igual de interesantes para prospectar, se
  // muestran aparte para no mezclar "pidio contacto" con "solo simulo".
  const completaronVistos = new Set<string>();
  const completaronSimulador = formEvents.filter((evento) => {
    const empleadoId = evento.user.employee?.id;
    if (!empleadoId || interesadosVistos.has(empleadoId) || completaronVistos.has(empleadoId)) return false;
    completaronVistos.add(empleadoId);
    return true;
  });

  return (
    <main className="min-h-screen font-body" style={{ background: "#F0F2F8" }}>
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <WoopLockup size="sm" />
          <div className="font-data flex gap-4 text-sm" style={{ color: `${I}70` }}>
            <Link href="/dashboard" className="hover:opacity-70">Panel de leads →</Link>
            <Link href="/creditos" className="hover:opacity-70">← Sitio público</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 overflow-hidden rounded-3xl bg-white" style={{ boxShadow: "0 4px 24px rgba(22,41,77,0.07)" }}>
          <div className="flex items-center justify-between px-7 py-5" style={{ background: `${R}10` }}>
            <div className="font-body text-base font-bold" style={{ color: I }}>
              📞 Interesados en ser contactados ({interesados.length})
            </div>
            <span className="font-data text-xs" style={{ color: `${I}55` }}>
              Llenaron el formulario de Woop y pidieron que un asesor los contacte
            </span>
          </div>
          {interesados.length === 0 ? (
            <p className="font-data px-7 py-8 text-center text-sm" style={{ color: `${I}40` }}>
              Todavía ningún colaborador pidió ser contactado desde el simulador de Woop.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="font-data w-full text-left text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${I}0C` }}>
                    {[
                      "Colaborador", "Empresa", "Monto / plazo", "Tasa E.A.", "Cuota/mes",
                      "Propósito", "Producto ML", "Lead", "Solicitado", "Estado",
                    ].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: `${I}55` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {interesados.map((evento) => {
                    const meta = parseWoopFormMetadata(evento.metadata);
                    const empleado = evento.user.employee!;
                    const leadStatus = evento.user.intentScore?.leadStatus ?? "frio";
                    const leadScore = evento.user.intentScore?.currentScore ?? 0;
                    const topProduct = empleado.productScore?.topProduct;
                    return (
                      <tr key={evento.id} className="transition hover:bg-gray-50" style={{ borderBottom: `1px solid ${I}08` }}>
                        <td className="px-3 py-2.5">
                          <Link href={`/colaboradores/${empleado.cedula}`} className="font-semibold hover:underline" style={{ color: I }}>
                            {empleado.nombre}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>{empleado.empresa}</td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.monto ? fmt(meta.monto) : "—"}
                          {meta?.plazoMeses ? ` · ${meta.plazoMeses}m` : ""}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.tasaAnual ? `${(meta.tasaAnual * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.cuotaMensual ? fmt(meta.cuotaMensual) : "—"}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.proposito ? PROPOSITO_LABELS[meta.proposito] ?? meta.proposito : "—"}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {topProduct ? PRODUCT_LABELS[topProduct] ?? topProduct : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ background: `${STATUS_COLOR[leadStatus]}18`, color: STATUS_COLOR[leadStatus] }}
                          >
                            {leadStatus} · {leadScore}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: `${I}55` }}>
                          {new Date(evento.occurredAt).toLocaleDateString("es-CO")}
                        </td>
                        <td className="px-3 py-2.5">
                          {evento.user.contactadoPorAsesor ? (
                            <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: `${T}18`, color: T }}>
                              ✓ Contactado
                            </span>
                          ) : (
                            <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "#EEF0F6", color: `${I}55` }}>
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl bg-white" style={{ boxShadow: "0 4px 24px rgba(22,41,77,0.07)" }}>
          <div className="flex items-center justify-between px-7 py-5" style={{ background: `${Y}10` }}>
            <div className="font-body text-base font-bold" style={{ color: I }}>
              📊 Completaron el simulador ({completaronSimulador.length})
            </div>
            <span className="font-data text-xs" style={{ color: `${I}55` }}>
              Usaron el simulador de Woop pero todavía no pidieron ser contactados
            </span>
          </div>
          {completaronSimulador.length === 0 ? (
            <p className="font-data px-7 py-8 text-center text-sm" style={{ color: `${I}40` }}>
              No hay colaboradores que hayan simulado sin pedir contacto todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="font-data w-full text-left text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${I}0C` }}>
                    {["Colaborador", "Empresa", "Monto / plazo", "Tasa E.A.", "Cuota/mes", "Propósito", "Producto ML", "Lead", "Fecha"].map(
                      (h) => (
                        <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: `${I}55` }}>
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {completaronSimulador.map((evento) => {
                    const meta = parseWoopFormMetadata(evento.metadata);
                    const empleado = evento.user.employee!;
                    const leadStatus = evento.user.intentScore?.leadStatus ?? "frio";
                    const leadScore = evento.user.intentScore?.currentScore ?? 0;
                    const topProduct = empleado.productScore?.topProduct;
                    return (
                      <tr key={evento.id} className="transition hover:bg-gray-50" style={{ borderBottom: `1px solid ${I}08` }}>
                        <td className="px-3 py-2.5">
                          <Link href={`/colaboradores/${empleado.cedula}`} className="font-semibold hover:underline" style={{ color: I }}>
                            {empleado.nombre}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>{empleado.empresa}</td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.monto ? fmt(meta.monto) : "—"}
                          {meta?.plazoMeses ? ` · ${meta.plazoMeses}m` : ""}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.tasaAnual ? `${(meta.tasaAnual * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.cuotaMensual ? fmt(meta.cuotaMensual) : "—"}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {meta?.proposito ? PROPOSITO_LABELS[meta.proposito] ?? meta.proposito : "—"}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: `${I}70` }}>
                          {topProduct ? PRODUCT_LABELS[topProduct] ?? topProduct : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ background: `${STATUS_COLOR[leadStatus]}18`, color: STATUS_COLOR[leadStatus] }}
                          >
                            {leadStatus} · {leadScore}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: `${I}55` }}>
                          {new Date(evento.occurredAt).toLocaleDateString("es-CO")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-3xl bg-white p-9" style={{ boxShadow: "0 4px 24px rgba(22,41,77,0.07)" }}>
          <div className="mb-6 flex items-center gap-4">
            <WoopyMascot size={56} mood="thinking" />
            <div>
              <div className="font-body text-lg font-bold" style={{ color: I }}>Buscar cliente por cédula</div>
              <div className="font-data text-sm" style={{ color: `${I}55` }}>
                Perfil enriquecido con datos reales de redes sociales y probabilidad de crédito
              </div>
            </div>
          </div>
          <SearchByCedula />
        </div>

        <div className="rounded-3xl bg-white p-7" style={{ boxShadow: "0 4px 24px rgba(22,41,77,0.07)" }}>
          <div className="font-data mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: `${I}45` }}>
            Todos los colaboradores ({employees.length})
          </div>
          <div className="overflow-x-auto">
            <table className="font-data w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${I}0C` }}>
                  {["Cédula", "Nombre", "Empresa", "Rol", "Actividad en créditos"].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: `${I}55` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="transition hover:bg-gray-50" style={{ borderBottom: `1px solid ${I}08` }}>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: `${I}70` }}>{emp.cedula}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/colaboradores/${emp.cedula}`} className="font-semibold hover:underline" style={{ color: I }}>
                        {emp.nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: `${I}70` }}>{emp.empresa}</td>
                    <td className="px-3 py-2.5" style={{ color: `${I}70` }}>{emp.rol}</td>
                    <td className="px-3 py-2.5">
                      {emp.linkedUser ? (
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: `${T}18`, color: T }}>
                          Detectada
                        </span>
                      ) : (
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "#EEF0F6", color: `${I}55` }}>
                          Sin actividad
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center" style={{ color: `${I}40` }}>
                      Todavía no hay colaboradores. Corré <code>npm run seed</code> para generar datos de ejemplo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
