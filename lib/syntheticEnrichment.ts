// Fallback usado SOLO cuando EnsembleData responde con error (ej. suscripcion
// vencida) — para que la demo de enriquecimiento + keywords siga funcionando de
// punta a punta aunque la API real este caida. Nunca reemplaza una respuesta real
// ni un "no encontrado" genuino (matchedUsername null sin error); se marca
// explicitamente como "simulado" via el campo `source` para que quede claro en la UI.

export interface PerfilSintetico {
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  verified: boolean;
  engagementRate: number;
  profileUrl: string;
}

// Bios variadas que a proposito tocan las keywords de api/probabilidad.py
// (mama/papa+emprendedor -> mujeres/mipymes, negocio/catalogo -> mipymes,
// universidad/curso -> educativo, casa propia/remodelacion -> hipotecario/mejora
// vivienda, viajera/gym -> libre inversion), con variante segun genero para que
// la concordancia gramatical no quede rara (ej. "emprendedora" en perfil de un
// colaborador registrado como "M").
const BIOS_SINTETICAS: Record<"F" | "M" | "X", string[]> = {
  F: [
    "mamá emprendedora, dueña de mi negocio de repostería 🎂",
    "estudiante de la universidad, cursando maestría los fines de semana 📚",
    "en plena remodelación de mi casa propia, poco a poco 🏠🔨",
    "viajera empedernida, amante del gym y la moda 👟✈️",
    "vendo por catálogo, mi tienda de manualidades 🛍️",
    "cabeza de familia, sacando adelante a mis hijos 💪",
    "amante del hogar y la decoración los fines de semana 🏡",
    "cursando un curso de posgrado en la universidad 🎓",
    "emprendedora de corazón, mi propia marca de ropa 👗",
    "entrenamiento diario en el gym, viajera cuando se puede ✈️",
  ],
  M: [
    "papá emprendedor, dueño de mi negocio de asados 🍖",
    "estudiante de la universidad, cursando maestría los fines de semana 📚",
    "en plena remodelación de mi casa propia, poco a poco 🏠🔨",
    "viajero empedernido, amante del gym y el fútbol ⚽✈️",
    "vendo por catálogo, mi tienda de tecnología 🛍️",
    "cabeza de familia, sacando adelante a mis hijos 💪",
    "amante del hogar y la decoración los fines de semana 🏡",
    "cursando un curso de posgrado en la universidad 🎓",
    "emprendedor de corazón, mi propia marca de ropa 👕",
    "entrenamiento diario en el gym, viajero cuando se puede ✈️",
  ],
  get X() {
    return BIOS_SINTETICAS.F;
  },
};

function seedFromString(texto: string): number {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  return hash;
}

export function generarPerfilSintetico(
  nombre: string,
  provider: "instagram" | "tiktok",
  genero: "F" | "M" | "X" = "F"
): PerfilSintetico {
  const seed = seedFromString(`${nombre}::${provider}`);
  const usernameBase = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  const username = `${usernameBase}${10 + (seed % 90)}`;
  const bios = BIOS_SINTETICAS[genero] ?? BIOS_SINTETICAS.F;
  const bio = bios[seed % bios.length];
  const followers = 300 + (seed % 18_000);
  const engagementRate = Number((0.01 + ((seed % 80) / 1000)).toFixed(3));

  return {
    username,
    displayName: nombre,
    bio,
    followers,
    verified: seed % 37 === 0,
    engagementRate,
    profileUrl:
      provider === "instagram" ? `https://instagram.com/${username}` : `https://tiktok.com/@${username}`,
  };
}
