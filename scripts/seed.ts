import { randomUUID } from "crypto";
import { execFileSync } from "child_process";
import path from "path";
import { prisma } from "../lib/prisma";
import { recalculateScoreForUser } from "../lib/scoring";

const PYTHON_SCRIPT = path.join(__dirname, "..", "api", "probabilidad.py");

// Corre el mismo motor de probabilidad (Python) que usa la funcion serverless
// de produccion, para que el seed y el endpoint en vivo nunca queden desincronizados.
function calcularProbabilidadesPython(perfil: Record<string, unknown>) {
  const salida = execFileSync("python", [PYTHON_SCRIPT], {
    input: JSON.stringify(perfil),
    encoding: "utf8",
  });
  const { tasaMujeresEA: _tasaMujeresEA, ...scores } = JSON.parse(salida);
  return scores as {
    libreInversion: number;
    hipotecario: number;
    mejoraVivienda: number;
    educativo: number;
    mujeres: number;
    compraCartera: number;
    mipymes: number;
    cupoRotativo: number;
    topProduct: string;
  };
}

const SCORING_RULES = [
  { eventType: "page_view", points: 5, description: "Vio una página del sitio" },
  { eventType: "search", points: 10, description: "Buscó algo dentro del sitio" },
  { eventType: "simulator_use", points: 15, description: "Usó el simulador tradicional" },
  { eventType: "form_abandon", points: 20, description: "Abandonó un formulario a medias" },
  { eventType: "chatbot_simulacion", points: 40, description: "Completó una simulación por chatbot" },
  { eventType: "form_complete", points: 30, description: "Completó un formulario" },
];

const FIRST_NAMES = [
  "Valentina", "Santiago", "Camila", "Mateo", "Isabella", "Sebastian", "Sofia", "Nicolas",
  "Mariana", "Andres", "Daniela", "Julian", "Laura", "David", "Paula", "Alejandro",
  "Natalia", "Diego", "Carolina", "Felipe",
];
const LAST_NAMES = [
  "Gomez", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Garcia", "Perez", "Sanchez",
  "Ramirez", "Torres", "Diaz", "Vargas", "Castro", "Ortiz", "Rojas",
];
const DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];
const DEVICE_TYPES = ["desktop", "mobile", "tablet"];
const REFERRERS = [
  null,
  "https://www.google.com/",
  "https://www.facebook.com/",
  "https://www.instagram.com/",
  null,
];
const UTM_SOURCES = [null, "google", "facebook", "instagram", "newsletter"];
const SEARCH_TERMS = [
  "credito vehiculo", "cuanto tarda el desembolso", "credito educativo", "prepago",
  "credito vivienda", "requisitos credito", "tasa de interes", "libre inversion",
];
const PAGES = ["/creditos", "/creditos/simulador"];
const CREDIT_TYPES = ["libre-inversion", "vehiculo", "educativo", "vivienda"];

const EMPRESAS_AFILIADAS = [
  "Textiles del Norte S.A.S", "Distribuidora La Sabana", "Constructora Andina",
  "Grupo Logístico Bogotá", "Alimentos El Trigal", "Servicios Integrales Colsubsidio",
  "Manufacturas Bicentenario", "Comercializadora del Valle", "Industrias Metálicas Suba",
  "Salud Total Corporativo",
];
const ROLES = [
  "Analista", "Coordinador", "Auxiliar administrativo", "Supervisor de planta",
  "Asesor comercial", "Jefe de área", "Ejecutivo de cuenta", "Técnico operativo",
];
const GENEROS = ["F", "M"];
const CATEGORIAS_AFILIACION = ["A", "B", "C"];
const VINCULACIONES = ["asalariado", "pensionado", "independiente"];

function randomCedula(): string {
  return String(randInt(1_000_000_000, 1_099_999_999));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function randomDateWithinDays(days: number): Date {
  const now = Date.now();
  const past = now - randInt(0, days) * 24 * 60 * 60 * 1000 - randInt(0, 86400000);
  return new Date(past);
}

function randomSimulationMetadata() {
  const monto = randInt(2, 100) * 1_000_000;
  const plazoMeses = pick([12, 24, 36, 48, 60]);
  const tasaMensual = 0.18 / 12;
  const factor = Math.pow(1 + tasaMensual, plazoMeses);
  const cuotaMensual = Math.round((monto * tasaMensual * factor) / (factor - 1));
  return {
    monto,
    plazoMeses,
    cuotaMensual,
    totalPagado: cuotaMensual * plazoMeses,
    totalIntereses: cuotaMensual * plazoMeses - monto,
  };
}

async function main() {
  console.log("Limpiando datos existentes...");
  await prisma.employeeEnrichment.deleteMany();
  await prisma.creditProductScore.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.intentScore.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.scoringRule.deleteMany();

  console.log("Creando reglas de scoring...");
  for (const rule of SCORING_RULES) {
    await prisma.scoringRule.create({ data: rule });
  }

  const NUM_USERS = 50;
  console.log(`Generando ${NUM_USERS} usuarios sintéticos...`);

  const usuariosConActividad: { id: string; nombre: string }[] = [];

  for (let i = 0; i < NUM_USERS; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const isIdentified = Math.random() < 0.35;
    const firstSeenAt = randomDateWithinDays(30);

    const user = await prisma.user.create({
      data: {
        cookieId: randomUUID(),
        isIdentified,
        email: isIdentified
          ? `${firstName}.${lastName}${randInt(1, 99)}@${pick(DOMAINS)}`.toLowerCase()
          : null,
        firstSeenAt,
        lastSeenAt: firstSeenAt,
        consentGiven: true,
        consentDate: firstSeenAt,
      },
    });

    // Distribución de "engagement": la mayoría con pocas visitas, algunos muy activos
    const engagementRoll = Math.random();
    const numSessions =
      engagementRoll < 0.5 ? 1 : engagementRoll < 0.8 ? randInt(2, 4) : randInt(5, 8);

    let lastEventDate = firstSeenAt;
    const usesSimulator = Math.random() < 0.4;
    const usesChatbot = Math.random() < 0.25;
    const abandonsForm = Math.random() < 0.3;

    for (let s = 0; s < numSessions; s++) {
      const sessionStart = new Date(
        firstSeenAt.getTime() + s * randInt(1, 5) * 24 * 60 * 60 * 1000
      );
      const deviceType = pick(DEVICE_TYPES);
      const referrer = pick(REFERRERS);
      const utmSource = referrer ? pick(UTM_SOURCES) : null;
      const landingPage = pick(PAGES);

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          startedAt: sessionStart,
          endedAt: new Date(sessionStart.getTime() + randInt(1, 20) * 60 * 1000),
          deviceType,
          referrer: referrer ?? undefined,
          utmSource: utmSource ?? undefined,
          utmMedium: utmSource ? "cpc" : undefined,
          utmCampaign: utmSource ? "hackathon-demo" : undefined,
          landingPage,
        },
      });

      let cursor = sessionStart;
      const addEvent = async (
        eventType: string,
        extra: Partial<{
          pageUrl: string;
          searchTerm: string;
          elementClicked: string;
          metadata: Record<string, unknown>;
        }> = {}
      ) => {
        cursor = new Date(cursor.getTime() + randInt(5, 90) * 1000);
        await prisma.event.create({
          data: {
            sessionId: session.id,
            userId: user.id,
            eventType,
            pageUrl: extra.pageUrl,
            searchTerm: extra.searchTerm,
            elementClicked: extra.elementClicked,
            metadata: extra.metadata ? JSON.stringify(extra.metadata) : null,
            occurredAt: cursor,
          },
        });
        lastEventDate = cursor;
      };

      // Toda sesión arranca con al menos un page_view
      await addEvent("page_view", { pageUrl: landingPage });

      if (Math.random() < 0.5) {
        await addEvent("page_view", { pageUrl: pick(PAGES) });
      }

      if (Math.random() < 0.4) {
        await addEvent("search", { searchTerm: pick(SEARCH_TERMS) });
      }

      if (Math.random() < 0.5) {
        await addEvent("click", { elementClicked: `credito_${pick(CREDIT_TYPES)}` });
      }

      if (usesSimulator && Math.random() < 0.7) {
        await addEvent("form_start", { pageUrl: "/creditos/simulador" });
        if (abandonsForm && Math.random() < 0.5) {
          await addEvent("form_abandon", { pageUrl: "/creditos/simulador" });
        } else {
          const metadata = randomSimulationMetadata();
          await addEvent("simulator_use", { metadata });
          await addEvent("form_complete", { pageUrl: "/creditos/simulador", metadata });
        }
      }

      if (usesChatbot && Math.random() < 0.6) {
        const metadata = randomSimulationMetadata();
        await addEvent("chatbot_simulacion", {
          metadata: { input: { monto: metadata.monto, plazoMeses: metadata.plazoMeses }, result: metadata },
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: lastEventDate },
    });

    await recalculateScoreForUser(user.id);

    if (numSessions > 0) {
      usuariosConActividad.push({ id: user.id, nombre: `${firstName} ${lastName}` });
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${NUM_USERS} usuarios creados`);
    }
  }

  console.log("Generando colaboradores sintéticos...");
  const NUM_EMPLOYEES = 50;
  const usadosComoLink = new Set<string>();

  for (let i = 0; i < NUM_EMPLOYEES; i++) {
    // ~35% de los colaboradores se vinculan a un usuario ya sembrado del sitio publico,
    // simulando "este colaborador si visito colsubsidio.com/creditos"
    const linkear = Math.random() < 0.35 && usuariosConActividad.length > usadosComoLink.size;

    let linkedUserId: string | undefined;
    let nombre: string;

    if (linkear) {
      let candidato;
      do {
        candidato = pick(usuariosConActividad);
      } while (usadosComoLink.has(candidato.id));
      usadosComoLink.add(candidato.id);
      linkedUserId = candidato.id;
      nombre = candidato.nombre;
    } else {
      nombre = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    }

    const genero = pick(GENEROS);
    const edad = randInt(21, 60);
    const antiguedad = randInt(0, Math.min(edad - 18, 25));
    const tipoVinculacion = pick(VINCULACIONES);
    const categoriaAfiliacion = pick(CATEGORIAS_AFILIACION);
    const libranza = Math.random() < 0.4;
    const tieneCreditoVivienda = Math.random() < 0.15;
    const tieneTarjetaColsubsidio = Math.random() < 0.8;

    const employee = await prisma.employee.create({
      data: {
        cedula: randomCedula(),
        nombre,
        empresa: pick(EMPRESAS_AFILIADAS),
        antiguedad,
        rol: pick(ROLES),
        salario: randInt(13, 90) * 100_000,
        correo: `${nombre.toLowerCase().replace(/\s+/g, ".")}${randInt(1, 99)}@${pick(DOMAINS)}`,
        edad,
        hijos: randInt(0, 3),
        genero,
        categoriaAfiliacion,
        tipoVinculacion,
        libranza,
        tieneCreditoVivienda,
        tieneTarjetaColsubsidio,
        linkedUserId,
      },
    });

    const scores = calcularProbabilidadesPython({
      edad: employee.edad,
      antiguedad: employee.antiguedad,
      salario: employee.salario,
      hijos: employee.hijos,
      genero: employee.genero,
      categoriaAfiliacion: employee.categoriaAfiliacion,
      tipoVinculacion: employee.tipoVinculacion,
      libranza: employee.libranza,
      tieneCreditoVivienda: employee.tieneCreditoVivienda,
      tieneTarjetaColsubsidio: employee.tieneTarjetaColsubsidio,
    });
    await prisma.creditProductScore.create({
      data: { employeeId: employee.id, ...scores },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${NUM_EMPLOYEES} colaboradores creados`);
    }
  }

  console.log("Seed completado.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
