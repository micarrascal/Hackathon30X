"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { I, Y, R } from "@/components/woop/tokens";

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
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        placeholder="Número de cédula"
        className="font-display flex-1 rounded-xl px-5 py-4 text-2xl font-semibold outline-none"
        style={{ background: "#F7F8FC", border: `2px solid ${Y}`, color: I }}
      />
      <button
        type="submit"
        className="font-body shrink-0 rounded-xl px-8 py-4 text-sm font-bold text-white transition active:scale-95"
        style={{ background: `linear-gradient(135deg, ${Y}, ${R})`, boxShadow: "0 6px 20px rgba(255,107,74,0.3)" }}
      >
        Buscar
      </button>
    </form>
  );
}
