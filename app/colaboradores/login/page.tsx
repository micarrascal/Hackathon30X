"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ColaboradoresLoginPage() {
  const router = useRouter();
  const [cedulaAcceso, setCedulaAcceso] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    document.cookie = "h30x_staff=1; path=/; max-age=86400";
    document.cookie = `h30x_staff_id=${encodeURIComponent(cedulaAcceso)}; path=/; max-age=86400`;
    router.push("/colaboradores");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-700 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-bold text-gray-900">Portal de colaboradores</h1>
        <p className="mt-1 text-sm text-gray-500">Colsubsidio · Acceso interno</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cédula corporativa
            </label>
            <input
              type="text"
              required
              value={cedulaAcceso}
              onChange={(e) => setCedulaAcceso(e.target.value)}
              placeholder="Ej: 1020304050"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Ingresar
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-400">
          Login simulado para la demo — no valida credenciales reales contra ningún sistema.
        </p>
      </div>
    </main>
  );
}
