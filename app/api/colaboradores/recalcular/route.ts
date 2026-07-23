import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularProbabilidadesProducto } from "@/lib/product-scoring";

export async function POST(req: NextRequest) {
  const { cedula } = await req.json();

  if (!cedula) {
    return NextResponse.json({ error: "cedula es requerida" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { cedula } });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  const [events, sessions] = employee.linkedUserId
    ? await Promise.all([
        prisma.event.findMany({ where: { userId: employee.linkedUserId } }),
        prisma.session.findMany({ where: { userId: employee.linkedUserId } }),
      ])
    : [[], []];

  const scores = calcularProbabilidadesProducto(employee, events, sessions);

  const saved = await prisma.creditProductScore.upsert({
    where: { employeeId: employee.id },
    update: { ...scores, computedAt: new Date() },
    create: { employeeId: employee.id, ...scores },
  });

  return NextResponse.json(saved);
}
