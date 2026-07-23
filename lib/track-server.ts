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
  | "chatbot_simulacion";

export interface LogEventInput {
  userId: string;
  sessionId: string;
  eventType: TrackableEventType;
  pageUrl?: string;
  searchTerm?: string;
  elementClicked?: string;
  metadata?: Record<string, unknown>;
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
