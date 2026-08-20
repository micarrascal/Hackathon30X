import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OfertaEmailForm from "@/components/OfertaEmailForm";
import WoopLockup from "@/components/woop/WoopLockup";
import { construirOfertaEmail } from "@/lib/ofertaEmail";
import { I } from "@/components/woop/tokens";

export const dynamic = "force-dynamic";

export default async function OfertaPage({ params }: { params: { cedula: string } }) {
  const isStaff = cookies().get("h30x_staff")?.value === "1";
  if (!isStaff) redirect("/colaboradores/login");

  const employee = await prisma.employee.findUnique({
    where: { cedula: params.cedula },
    include: { productScore: true },
  });

  if (!employee) notFound();

  const host = headers().get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const simuladorUrl = `${protocol}://${host}/creditos/simulador`;

  const topProduct = employee.productScore?.topProduct ?? null;
  const topValue =
    topProduct && employee.productScore
      ? ((employee.productScore as unknown as Record<string, number>)[topProduct] ?? null)
      : null;

  const { asunto, cuerpo } = construirOfertaEmail({
    nombre: employee.nombre,
    topProduct,
    topValue,
    simuladorUrl,
  });

  return (
    <main className="min-h-screen font-body" style={{ background: "#F0F2F8" }}>
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <WoopLockup size="sm" />
          <Link
            href={`/colaboradores/${employee.cedula}/recomendacion`}
            className="font-data text-sm"
            style={{ color: `${I}60` }}
          >
            ← Volver a la recomendación
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold" style={{ color: I }}>
            Enviar oferta por correo
          </h1>
          <p className="font-data mt-1 text-sm" style={{ color: `${I}55` }}>
            Para {employee.nombre} · {employee.empresa}
          </p>
        </div>

        <OfertaEmailForm
          cedula={employee.cedula}
          destinatario={employee.correo}
          asuntoInicial={asunto}
          cuerpoInicial={cuerpo}
          productoTop={topProduct}
          ofertaEnviadaAt={employee.ofertaEnviadaAt}
        />
      </div>
    </main>
  );
}
