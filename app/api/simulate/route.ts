import { NextRequest, NextResponse } from "next/server";
import { calcularSimulacion } from "@/lib/credit-calculator";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { monto, plazoMeses, ingresoMensual } = body;

  try {
    const result = calcularSimulacion({
      monto: Number(monto),
      plazoMeses: Number(plazoMeses),
      ingresoMensual: ingresoMensual ? Number(ingresoMensual) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al calcular la simulacion";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
