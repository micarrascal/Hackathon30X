import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, createSession } from "@/lib/track-server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    cookieId,
    deviceType,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    landingPage,
  } = body;

  if (!cookieId || !deviceType || !landingPage) {
    return NextResponse.json(
      { error: "cookieId, deviceType y landingPage son requeridos" },
      { status: 400 }
    );
  }

  const user = await getOrCreateUser(cookieId);
  const session = await createSession({
    userId: user.id,
    deviceType,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    landingPage,
  });

  return NextResponse.json({ userId: user.id, sessionId: session.id });
}
