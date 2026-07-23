import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buscarEnRedes } from "@/lib/ensembledata";
import { obtenerPerfilInstagram, obtenerPerfilTiktok } from "@/lib/socialcrawl";

export async function POST(req: NextRequest) {
  const { cedula } = await req.json();

  if (!cedula) {
    return NextResponse.json({ error: "cedula es requerida" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { cedula } });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  // Paso 1: EnsembleData busca por nombre y descubre un username candidato.
  const ensembleResults = await buscarEnRedes(employee.nombre);

  // Paso 2: si aparecio un username, SocialCrawl trae un perfil mas completo y limpio
  // para ese mismo handle (SocialCrawl no busca por nombre, solo por handle conocido).
  const combined = await Promise.all(
    ensembleResults.map(async (r) => {
      if (!r.matchedUsername) {
        return { ...r, source: "ensembledata" as const, verified: null, engagementRate: null };
      }

      const perfil =
        r.provider === "tiktok"
          ? await obtenerPerfilTiktok(r.matchedUsername)
          : await obtenerPerfilInstagram(r.matchedUsername);

      if (!perfil) {
        return { ...r, source: "ensembledata" as const, verified: null, engagementRate: null };
      }

      return {
        provider: r.provider,
        query: r.query,
        matchedUsername: perfil.username,
        matchedFullName: perfil.displayName ?? r.matchedFullName,
        bio: perfil.bio ?? r.bio,
        followers: perfil.followers ?? r.followers,
        profileUrl: perfil.profileUrl,
        verified: perfil.verified,
        engagementRate: perfil.engagementRate,
        raw: { ensembledata: r.raw, socialcrawl: perfil.raw },
        source: "ensembledata+socialcrawl" as const,
      };
    })
  );

  await prisma.employeeEnrichment.deleteMany({
    where: { employeeId: employee.id, provider: { in: combined.map((r) => r.provider) } },
  });

  await prisma.employeeEnrichment.createMany({
    data: combined.map((r) => ({
      employeeId: employee.id,
      provider: r.provider,
      source: r.source,
      query: r.query,
      matchedUsername: r.matchedUsername,
      matchedFullName: r.matchedFullName,
      bio: r.bio,
      followers: r.followers,
      verified: r.verified,
      engagementRate: r.engagementRate,
      profileUrl: r.profileUrl,
      raw: r.raw ? JSON.stringify(r.raw) : null,
    })),
  });

  return NextResponse.json({ results: combined });
}
