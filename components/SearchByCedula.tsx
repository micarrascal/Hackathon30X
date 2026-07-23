"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchByCedula() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = cedula.trim();
    if (!value) return;
    router.push(`/colaboradores/${value}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        placeholder="Buscar por número de cédula..."
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
      >
        Buscar
      </button>
    </form>
  );
}
