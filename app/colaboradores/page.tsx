import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SearchByCedula from "@/components/SearchByCedula";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage() {
  const isStaff = cookies().get("h30x_staff")?.value === "1";
  if (!isStaff) redirect("/colaboradores/login");

  const employees = await prisma.employee.findMany({
    orderBy: { nombre: "asc" },
    include: { linkedUser: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal de colaboradores</h1>
          <p className="text-sm text-gray-500">
            Buscá por cédula para ver el perfil enriquecido de un colaborador.
          </p>
        </div>
        <Link href="/creditos" className="text-sm text-brand-600 hover:text-brand-800">
          ← Ir al sitio público
        </Link>
      </div>

      <SearchByCedula />

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Todos los colaboradores ({employees.length})
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Cédula</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Actividad en creditos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{emp.cedula}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/colaboradores/${emp.cedula}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {emp.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{emp.empresa}</td>
                <td className="px-4 py-3 text-gray-600">{emp.rol}</td>
                <td className="px-4 py-3">
                  {emp.linkedUser ? (
                    <span className="inline-block rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Detectada
                    </span>
                  ) : (
                    <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      Sin actividad
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Todavía no hay colaboradores. Corré <code>npm run seed</code> para generar datos
                  de ejemplo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
