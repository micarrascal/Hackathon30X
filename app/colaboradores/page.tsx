import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SearchByCedula from "@/components/SearchByCedula";
import WoopyMascot from "@/components/woop/WoopyMascot";
import WoopLockup from "@/components/woop/WoopLockup";
import { I, T } from "@/components/woop/tokens";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage() {
  const isStaff = cookies().get("h30x_staff")?.value === "1";
  if (!isStaff) redirect("/colaboradores/login");

  const employees = await prisma.employee.findMany({
    orderBy: { nombre: "asc" },
    include: { linkedUser: true },
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
