import { prisma } from "@/lib/prisma";
import StaffLoginForm from "@/components/StaffLoginForm";

export const dynamic = "force-dynamic";

export default async function ColaboradoresLoginPage() {
  const [conActividad, sinActividad] = await Promise.all([
    prisma.employee.findMany({ where: { linkedUserId: { not: null } }, take: 2, orderBy: { nombre: "asc" } }),
    prisma.employee.findMany({ where: { linkedUserId: null }, take: 2, orderBy: { nombre: "asc" } }),
  ]);
  const ejemplos = [...conActividad, ...sinActividad];

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-700 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-bold text-gray-900">Portal de colaboradores</h1>
        <p className="mt-1 text-sm text-gray-500">Colsubsidio · Acceso interno</p>

        <StaffLoginForm />

        <p className="mt-4 text-xs text-gray-400">
          Login simulado para la demo — cualquier cédula/contraseña te deja entrar, no valida
          contra ningún sistema real.
        </p>

        {ejemplos.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-600">
              Datos de prueba — una vez adentro, buscá alguna de estas cédulas:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              {ejemplos.map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="font-mono">{e.cedula}</span>
                  <span className="truncate text-gray-500">{e.nombre}</span>
                  {e.linkedUserId && (
                    <span className="shrink-0 rounded-full bg-green-100 px-1.5 text-green-700">
                      con actividad
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
