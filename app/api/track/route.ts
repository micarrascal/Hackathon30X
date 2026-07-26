import { NextRequest, NextResponse } from "next/server";
import { logEvent, TrackableEventType } from "@/lib/track-server";

const VALID_EVENT_TYPES: TrackableEventType[] = [
  "page_view",
  "search",
  "click",
  "simulator_use",
  "form_start",
  "form_abandon",
  "form_complete",
  "chatbot_simulacion",
  "contact_request",
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, sessionId, eventType, pageUrl, searchTerm, elementClicked, metadata } = body;

  if (!userId || !sessionId || !VALID_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json(
      { error: "userId, sessionId y un eventType valido son requeridos" },
      { status: 400 }
    );
  }

  const event = await logEvent({
    userId,
    sessionId,
    eventType,
    pageUrl,
    searchTerm,
    elementClicked,
    metadata,
  });

  return NextResponse.json({ ok: true, eventId: event.id });
}
