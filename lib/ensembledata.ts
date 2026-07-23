import { EDClient, EDError } from "ensembledata";

// Cliente real de EnsembleData (https://ensembledata.com). Metodos confirmados contra los
// tipos instalados del SDK (node_modules/ensembledata/types/client.d.ts):
//   - client.instagram.search({ text })   -> busqueda por keyword/nombre en Instagram
//   - client.tiktok.userSearch({ keyword }) -> busqueda por keyword/nombre en TikTok
// El shape de la respuesta (`data`) no esta tipado por el SDK (es `any`), asi que la
// extraccion de campos es defensiva: probamos varias formas plausibles y siempre
// devolvemos el JSON crudo para no perder informacion si el shape difiere.

let client: EDClient | null = null;

function getClient(): EDClient {
  if (!client) {
    const token = process.env.ENSEMBLEDATA_API_TOKEN;
    if (!token) {
      throw new Error("ENSEMBLEDATA_API_TOKEN no esta configurado");
    }
    client = new EDClient({ token });
  }
  return client;
}

export interface EnrichmentResult {
  provider: "instagram" | "tiktok";
  query: string;
  matchedUsername: string | null;
  matchedFullName: string | null;
  bio: string | null;
  followers: number | null;
  profileUrl: string | null;
  raw: unknown;
  error?: string;
}

// Desenvuelve una capa extra de anidamiento observada en las respuestas reales:
// Instagram devuelve cada resultado como { position, user: {...} }, TikTok como
// { position, user_info: {...}, ... }.
function unwrap(item: unknown): Record<string, unknown> {
  const obj = item as Record<string, unknown>;
  if (obj.user && typeof obj.user === "object") return obj.user as Record<string, unknown>;
  if (obj.user_info && typeof obj.user_info === "object")
    return obj.user_info as Record<string, unknown>;
  return obj;
}

function firstCandidate(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const arrays = [data, obj.users, obj.data, obj.results, obj.items];
  for (const candidate of arrays) {
    if (Array.isArray(candidate) && candidate.length > 0 && typeof candidate[0] === "object") {
      return unwrap(candidate[0]);
    }
  }
  if (obj.user && typeof obj.user === "object") return obj.user as Record<string, unknown>;
  if ("username" in obj || "uniqueId" in obj || "full_name" in obj) return obj;
  return null;
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function pickNumber(obj: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number") return value;
  }
  return null;
}

export async function buscarEnRedes(nombre: string): Promise<EnrichmentResult[]> {
  const [instagram, tiktok] = await Promise.all([
    buscarEnInstagram(nombre),
    buscarEnTiktok(nombre),
  ]);
  return [instagram, tiktok];
}

async function buscarEnInstagram(nombre: string): Promise<EnrichmentResult> {
  try {
    const response = await getClient().instagram.search({ text: nombre });
    const candidate = firstCandidate(response.data);
    return {
      provider: "instagram",
      query: nombre,
      matchedUsername: candidate ? pick(candidate, "username", "user_name") : null,
      matchedFullName: candidate ? pick(candidate, "full_name", "fullName", "name") : null,
      bio: candidate ? pick(candidate, "biography", "bio") : null,
      followers: candidate ? pickNumber(candidate, "follower_count", "followers") : null,
      profileUrl:
        candidate && pick(candidate, "username", "user_name")
          ? `https://instagram.com/${pick(candidate, "username", "user_name")}`
          : null,
      raw: response.data,
    };
  } catch (err) {
    return {
      provider: "instagram",
      query: nombre,
      matchedUsername: null,
      matchedFullName: null,
      bio: null,
      followers: null,
      profileUrl: null,
      raw: null,
      error: err instanceof EDError ? err.detail : "Error al consultar Instagram",
    };
  }
}

async function buscarEnTiktok(nombre: string): Promise<EnrichmentResult> {
  try {
    const response = await getClient().tiktok.userSearch({ keyword: nombre });
    const candidate = firstCandidate(response.data);
    return {
      provider: "tiktok",
      query: nombre,
      matchedUsername: candidate ? pick(candidate, "uniqueId", "username", "unique_id") : null,
      matchedFullName: candidate ? pick(candidate, "nickname", "full_name") : null,
      bio: candidate ? pick(candidate, "signature", "bio") : null,
      followers: candidate ? pickNumber(candidate, "followerCount", "follower_count") : null,
      profileUrl:
        candidate && pick(candidate, "uniqueId", "username", "unique_id")
          ? `https://tiktok.com/@${pick(candidate, "uniqueId", "username", "unique_id")}`
          : null,
      raw: response.data,
    };
  } catch (err) {
    return {
      provider: "tiktok",
      query: nombre,
      matchedUsername: null,
      matchedFullName: null,
      bio: null,
      followers: null,
      profileUrl: null,
      raw: null,
      error: err instanceof EDError ? err.detail : "Error al consultar TikTok",
    };
  }
}
