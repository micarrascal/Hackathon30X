"use client";

// Tracking first-party 100% propio: cookie propia (h30x_cid) + fetch a nuestras
// propias API routes. No se usa ningun pixel ni script de terceros.

const COOKIE_NAME = "h30x_cid";
const SESSION_STORAGE_KEY = "h30x_session";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateCookieId(): string {
  let cookieId = readCookie(COOKIE_NAME);
  if (!cookieId) {
    cookieId = generateId();
    writeCookie(COOKIE_NAME, cookieId);
  }
  return cookieId;
}

function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

interface SessionIds {
  userId: string;
  sessionId: string;
}

async function initSession(): Promise<SessionIds> {
  const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (cached) return JSON.parse(cached);

  const cookieId = getOrCreateCookieId();
  const params = new URLSearchParams(window.location.search);

  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cookieId,
      deviceType: detectDeviceType(),
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      landingPage: window.location.pathname,
    }),
  });

  const data = await res.json();
  const ids: SessionIds = { userId: data.userId, sessionId: data.sessionId };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ids));
  return ids;
}

let sessionPromise: Promise<SessionIds> | null = null;

export function ensureSession(): Promise<SessionIds> {
  if (!sessionPromise) sessionPromise = initSession();
  return sessionPromise;
}

export interface TrackEventOptions {
  pageUrl?: string;
  searchTerm?: string;
  elementClicked?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(eventType: string, options: TrackEventOptions = {}) {
  try {
    const { userId, sessionId } = await ensureSession();
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessionId,
        eventType,
        pageUrl: options.pageUrl ?? window.location.pathname,
        searchTerm: options.searchTerm,
        elementClicked: options.elementClicked,
        metadata: options.metadata,
      }),
    });
  } catch (err) {
    console.error("trackEvent failed", err);
  }
}

export async function getCurrentUserId(): Promise<string> {
  const { userId } = await ensureSession();
  return userId;
}
