"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { I, Y, R } from "@/components/woop/tokens";

export default function StaffLoginForm() {
  const router = useRouter();
  const [cedulaAcceso, setCedulaAcceso] = useState("ana.castro@colsubsidio.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/colaboradores");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // evita reintentos duplicados mientras navega/compila la ruta
    setLoading(true);
    document.cookie = "h30x_staff=1; path=/; max-age=86400";
    document.cookie = `h30x_staff_id=${encodeURIComponent(cedulaAcceso)}; path=/; max-age=86400`;
    router.push("/colaboradores");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>
          Usuario corporativo
        </label>
        <input
          type="text"
          required
          value={cedulaAcceso}
          onChange={(e) => setCedulaAcceso(e.target.value)}
          placeholder="ana.castro@colsubsidio.com"
          className="font-data w-full rounded-xl px-4 py-3.5 text-sm outline-none"
          style={{ background: "#F7F8FC", border: `1.5px solid ${I}10`, color: I }}
        />
      </div>
      <div className="mb-5">
        <label className="font-data mb-1.5 block text-xs font-semibold" style={{ color: I }}>
          Contraseña
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          className="font-data w-full rounded-xl px-4 py-3.5 text-sm outline-none"
          style={{ background: "#F7F8FC", border: `1.5px solid ${I}10`, color: I }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="font-body w-full rounded-2xl py-4 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60 disabled:active:scale-100"
        style={{ background: `linear-gradient(135deg, ${Y}, ${R})`, boxShadow: "0 8px 24px rgba(255,107,74,0.28)" }}
      >
        {loading ? "Ingresando…" : "Ingresar al sistema →"}
      </button>
    </form>
  );
}
