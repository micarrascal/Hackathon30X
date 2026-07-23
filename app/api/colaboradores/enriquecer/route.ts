import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buscarEnRedes } from "@/lib/ensembledata";

export async function POST(req: NextRequest) {
  const { cedula } = await req.json();

  if (!cedula) {
    return NextResponse.json({ error: "cedula es requerida" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { cedula } });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  const results = await buscarEnRedes(employee.nombre);

  await prisma.employeeEnrichment.deleteMany({
    where: { employeeId: employee.id, provider: { in: results.map((r) => r.provider) } },
  });

  await prisma.employeeEnrichment.createMany({
    data: results.map((r) => ({
      employeeId: employee.id,
      provider: r.provider,
      query: r.query,
      matchedUsername: r.matchedUsername,
      matchedFullName: r.matchedFullName,
      bio: r.bio,
      followers: r.followers,
      profileUrl: r.profileUrl,
      raw: r.raw ? JSON.stringify(r.raw) : null,
    })),
  });

  return NextResponse.json({ results });
}
