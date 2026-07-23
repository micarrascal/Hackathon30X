"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginForm() {
  const router = useRouter();
  const [cedulaAcceso, setCedulaAcceso] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    document.cookie = "h30x_staff=1; path=/; max-age=86400";
    document.cookie = `h30x_staff_id=${encodeURIComponent(cedulaAcceso)}; path=/; max-age=86400`;
    router.push("/colaboradores");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cédula corporativa</label>
        <input
          type="text"
          required
          value={cedulaAcceso}
          onChange={(e) => setCedulaAcceso(e.target.value)}
          placeholder="Ej: 1020304050 (cualquier valor sirve)"
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
  );
}
