import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductScorePanel from "@/components/ProductScorePanel";
import ProspectoActionsPanel from "@/components/ProspectoActionsPanel";
import WoopLockup from "@/components/woop/WoopLockup";
import { parseWoopFormMetadata } from "@/lib/woopForm";
import { I } from "@/components/woop/tokens";

export const dynamic = "force-dynamic";

export default async function RecomendacionPage({ params }: { params: { cedula: string } }) {
  const isStaff = cookies().get("h30x_staff")?.value === "1";
  if (!isStaff) redirect("/colaboradores/login");

  const employee = await prisma.employee.findUnique({
    where: { cedula: params.cedula },
    include: {
      enrichments: { orderBy: { fetchedAt: "desc" } },
      productScore: true,
      woopRegistro: true,
      linkedUser: { include: { events: { orderBy: { occurredAt: "desc" } } } },
    },
  });

  if (!employee) notFound();

  const linkedUser = employee.linkedUser;
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

  const host = headers().get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const simuladorUrl = `${protocol}://${host}/creditos/simulador`;

  const topProduct = employee.productScore?.topProduct ?? null;
  const topValue =
    topProduct && employee.productScore
      ? ((employee.productScore as unknown as Record<string, number>)[topProduct] ?? null)
      : null;

  return (
    <main className="min-h-screen font-body" style={{ background: "#F0F2F8" }}>
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <WoopLockup size="sm" />
          <Link href={`/colaboradores/${employee.cedula}`} className="font-data text-sm" style={{ color: `${I}60` }}>
            ← Volver al perfil de {employee.nombre.split(" ")[0]}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold" style={{ color: I }}>
            Recomendación de producto
          </h1>
          <p className="font-data mt-1 text-sm" style={{ color: `${I}55` }}>
            {employee.nombre} · {employee.empresa} · CC {employee.cedula}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <ProductScorePanel
            employee={{
              edad: employee.edad,
              antiguedad: employee.antiguedad,
              salario: employee.salario,
              hijos: employee.hijos,
              genero: employee.genero,
              categoriaAfiliacion: employee.categoriaAfiliacion,
              tipoVinculacion: employee.tipoVinculacion,
              libranza: employee.libranza,
              tieneCreditoVivienda: employee.tieneCreditoVivienda,
              tieneTarjetaColsubsidio: employee.tieneTarjetaColsubsidio,
            }}
            bios={employee.enrichments.map((e) => e.bio).filter((b): b is string => Boolean(b))}
            score={employee.productScore}
            woopRegistro={employee.woopRegistro}
          />

          {tieneFormWoop ? (
            <section className="rounded-3xl bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(22,41,77,0.06)" }}>
              <h2 className="font-display text-lg font-bold" style={{ color: I }}>
                Próximo paso
              </h2>
              <p className="font-data mt-2 text-sm" style={{ color: `${I}65` }}>
                Este colaborador ya completó el formulario de Woop y dejó sus datos de contacto — el flujo
                para contactarlo (WhatsApp, llamada, correo, marcar como contactado) está en su perfil.
              </p>
              <Link
                href={`/colaboradores/${employee.cedula}`}
                className="font-body mt-4 inline-block rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
                style={{ background: I }}
              >
                Ver perfil completo →
              </Link>
            </section>
          ) : (
            <ProspectoActionsPanel
              cedula={employee.cedula}
              nombre={employee.nombre}
              topProduct={topProduct}
              topValue={topValue}
              simuladorUrl={simuladorUrl}
              ofertaEnviadaAt={employee.ofertaEnviadaAt}
            />
          )}
        </div>
      </div>
    </main>
  );
}
