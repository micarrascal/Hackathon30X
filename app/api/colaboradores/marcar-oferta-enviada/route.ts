import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { cedula, producto } = await req.json();

  if (!cedula) {
    return NextResponse.json({ error: "cedula es requerida" }, { status: 400 });
  }

  const employee = await prisma.employee.update({
    where: { cedula },
    data: {
      ofertaEnviadaAt: new Date(),
      ofertaEnviadaProducto: producto ?? null,
    },
  });

  return NextResponse.json({
    ofertaEnviadaAt: employee.ofertaEnviadaAt,
    ofertaEnviadaProducto: employee.ofertaEnviadaProducto,
  });
}
