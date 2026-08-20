import { prisma } from "./prisma";
import { recalculateScoreForUser } from "./scoring";

export type TrackableEventType =
  | "page_view"
  | "search"
  | "click"
  | "simulator_use"
  | "form_start"
  | "form_abandon"
  | "form_complete"
  | "chatbot_simulacion"
  | "contact_request";

export interface LogEventInput {
  userId: string;
  sessionId: string;
  eventType: TrackableEventType;
  pageUrl?: string;
  searchTerm?: string;
  elementClicked?: string;
  metadata?: Record<string, unknown>;
}

// Si el formulario del simulador (o el chatbot) trae una cedula que coincide
// con un colaborador afiliado ya existente, vincula ese visitante anonimo al
// colaborador — asi la persona que lo llena en vivo en la demo aparece con
// "Lleno el formulario Woop" en su propio perfil de /colaboradores, en vez de
// quedar como un lead anonimo sin relacion con sus datos de afiliada.
async function linkEmployeeIfMatches(userId: string, metadata?: Record<string, unknown>) {
  const cedulaRaw = metadata?.cedula;
  if (typeof cedulaRaw !== "string") return;
  const cedula = cedulaRaw.replace(/\D/g, "");
  if (!cedula) return;

  const employee = await prisma.employee.findUnique({ where: { cedula } });
  if (!employee || employee.linkedUserId) return; // no existe o ya esta vinculado a otro visitante

  const usuarioYaVinculado = await prisma.employee.findUnique({ where: { linkedUserId: userId } });
  if (usuarioYaVinculado) return; // este visitante ya quedo vinculado a otro colaborador

  await prisma.employee.update({
    where: { id: employee.id },
    data: { linkedUserId: userId },
  });
}

export async function logEvent(input: LogEventInput) {
  const event = await prisma.event.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId,
      eventType: input.eventType,
      pageUrl: input.pageUrl,
      searchTerm: input.searchTerm,
      elementClicked: input.elementClicked,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: { lastSeenAt: new Date() },
  });

  try {
    await linkEmployeeIfMatches(input.userId, input.metadata);
  } catch {
    // no bloquear el tracking del sitio publico si la vinculacion falla
  }

  await recalculateScoreForUser(input.userId);

  return event;
}

export async function getOrCreateUser(cookieId: string) {
  const existing = await prisma.user.findUnique({ where: { cookieId } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
  }
  return prisma.user.create({
    data: { cookieId },
  });
}

export interface CreateSessionInput {
  userId: string;
  deviceType: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage: string;
}

export async function createSession(input: CreateSessionInput) {
  return prisma.session.create({
    data: {
      userId: input.userId,
      deviceType: input.deviceType,
      referrer: input.referrer,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      landingPage: input.landingPage,
    },
  });
}
