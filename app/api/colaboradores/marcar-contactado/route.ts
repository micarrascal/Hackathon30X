import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, contactado } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      contactadoPorAsesor: Boolean(contactado),
      contactadoAt: contactado ? new Date() : null,
    },
  });

  return NextResponse.json({
    contactadoPorAsesor: user.contactadoPorAsesor,
    contactadoAt: user.contactadoAt,
  });
}
