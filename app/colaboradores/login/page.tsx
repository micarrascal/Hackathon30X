import { prisma } from "@/lib/prisma";
import StaffLoginForm from "@/components/StaffLoginForm";
import WoopyMascot from "@/components/woop/WoopyMascot";
import WoopLockup from "@/components/woop/WoopLockup";
import { I, T } from "@/components/woop/tokens";

export const dynamic = "force-dynamic";

export default async function ColaboradoresLoginPage() {
  const [conActividad, sinActividad] = await Promise.all([
    prisma.employee.findMany({ where: { linkedUserId: { not: null } }, take: 2, orderBy: { nombre: "asc" } }),
    prisma.employee.findMany({ where: { linkedUserId: null }, take: 2, orderBy: { nombre: "asc" } }),
  ]);
  const ejemplos = [...conActividad, ...sinActividad];

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 font-body" style={{ background: "#F0F2F8" }}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-10 shadow-2xl" style={{ boxShadow: "0 8px 48px rgba(22,41,77,0.1)" }}>
        <div className="mb-8 flex flex-col items-center">
          <WoopyMascot size={88} />
          <div className="mt-3">
            <WoopLockup size="md" />
          </div>
          <p className="font-data mt-2 text-center text-sm" style={{ color: `${I}60` }}>
            Acceso interno — Asesores Colsubsidio
          </p>
        </div>

        <StaffLoginForm />

        <p className="font-data mt-4 text-center text-xs" style={{ color: `${I}40` }}>
          Login simulado para la demo — cualquier cédula/contraseña te deja entrar, no valida
          contra ningún sistema real.
        </p>

        {ejemplos.length > 0 && (
          <div className="mt-6 rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
            <p className="font-data text-xs font-semibold uppercase tracking-widest" style={{ color: `${I}45` }}>
              Datos de prueba
            </p>
            <p className="font-data mt-1 text-xs" style={{ color: `${I}55` }}>
              Una vez adentro, buscá alguna de estas cédulas:
            </p>
            <ul className="mt-3 space-y-1.5">
              {ejemplos.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-data font-semibold" style={{ color: I }}>{e.cedula}</span>
                  <span className="font-data truncate" style={{ color: `${I}55` }}>{e.nombre}</span>
                  {e.linkedUserId && (
                    <span
                      className="font-data shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${T}18`, color: T }}
                    >
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
