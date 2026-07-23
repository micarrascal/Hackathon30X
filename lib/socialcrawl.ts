// Cliente de SocialCrawl (https://www.socialcrawl.dev) — verificado con llamadas reales:
//   GET /v1/tiktok/profile?handle=...
//   GET /v1/instagram/profile?handle=...
// Requiere un handle/username ya conocido (no busca por nombre). Por eso se usa como
// "segunda pasada" sobre el username que EnsembleData encontro buscando por nombre:
// EnsembleData descubre el candidato, SocialCrawl trae un perfil mas limpio y completo.
// No existe /v1/instagram/search (confirmado con un 404 ENDPOINT_NOT_FOUND real).

const BASE_URL = "https://www.socialcrawl.dev";

export interface SocialCrawlProfile {
  platform: "tiktok" | "instagram";
  username: string;
  displayName: string | null;
  bio: string | null;
  verified: boolean;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  engagementRate: number | null;
  profileUrl: string;
  raw: unknown;
}

async function fetchProfile(
  platform: "tiktok" | "instagram",
  handle: string
): Promise<SocialCrawlProfile | null> {
  const apiKey = process.env.SOCIALCRAWL_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${BASE_URL}/v1/${platform}/profile`);
  url.searchParams.set("handle", handle);

  const res = await fetch(url, { headers: { "x-api-key": apiKey } });
  const json = await res.json();

  if (!json.success || !json.data?.author) return null;

  const author = json.data.author as Record<string, unknown>;
  const computed = (json.data.computed ?? {}) as Record<string, unknown>;

  return {
    platform,
    username: String(author.username ?? handle),
    displayName: typeof author.display_name === "string" ? author.display_name : null,
    bio: typeof author.bio === "string" ? author.bio : null,
    verified: Boolean(author.verified),
    followers: typeof author.followers === "number" ? author.followers : null,
    following: typeof author.following === "number" ? author.following : null,
    postsCount: typeof author.posts_count === "number" ? author.posts_count : null,
    engagementRate:
      typeof computed.engagement_rate === "number" ? computed.engagement_rate : null,
    profileUrl:
      platform === "tiktok"
        ? `https://tiktok.com/@${author.username}`
        : `https://instagram.com/${author.username}`,
    raw: json,
  };
}

export function obtenerPerfilTiktok(handle: string): Promise<SocialCrawlProfile | null> {
  return fetchProfile("tiktok", handle).catch(() => null);
}

export function obtenerPerfilInstagram(handle: string): Promise<SocialCrawlProfile | null> {
  return fetchProfile("instagram", handle).catch(() => null);
}
