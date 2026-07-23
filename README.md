# Hackathon30X — Portal de créditos Colsubsidio

Demo de **hackathon interno de Colsubsidio** que detecta **intención de solicitud de crédito**
combinando tracking de comportamiento first-party, un chatbot conversacional que simula un
crédito, y un portal interno de colaboradores con enriquecimiento y probabilidad de producto.

**La marca es real (Colsubsidio), pero todos los datos son sintéticos**: usuarios, eventos,
empleados, cédulas, salarios y correos son generados por `npm run seed` — no corresponden a
personas reales ni a información real de RR.HH. de Colsubsidio. **No es un producto de
producción.**

## Cómo correrlo

Requisitos: Node.js 18+ y una base **Postgres** (Vercel Postgres o Neon, ambos con free
tier — ver [Desplegar en Vercel](#desplegar-en-vercel) para cómo conseguir una en 2 minutos).
El proyecto dejó de usar SQLite porque no sobrevive en un entorno serverless como Vercel
(filesystem efímero) — ver la nota al final de esta sección.

```bash
npm install           # instala dependencias y corre `prisma generate`
cp .env.example .env  # completá ANTHROPIC_API_KEY, ENSEMBLEDATA_API_TOKEN, SOCIALCRAWL_API_KEY
                       # y las dos variables de Postgres (ver mas abajo)
npx prisma migrate dev --name init   # crea las tablas en tu Postgres (solo la primera vez)
npm run seed           # genera ~50 usuarios + ~50 colaboradores sinteticos
npm run dev             # http://localhost:3000 (redirige a /creditos)
```

Sin `ANTHROPIC_API_KEY`, `ENSEMBLEDATA_API_TOKEN` o `SOCIALCRAWL_API_KEY`, el resto del sitio
funciona igual — el chatbot y el botón "Buscar en redes" del portal de colaboradores
simplemente avisan que esa integración no está configurada.

> **Por qué Postgres y no SQLite:** las funciones serverless de Vercel corren en un
> filesystem efímero — un archivo `.db` local se resetea (o queda de solo lectura) en cada
> cold start, así que cualquier escritura (eventos, leads, colaboradores) se perdería. Para
> correr local sin depender de Vercel, la forma más simple es crear una base Postgres gratis
> en [neon.tech](https://neon.tech) y pegar su connection string en `.env` (ver abajo).

## Dónde está cada pieza

### Sitio público (`/creditos`)

| Pieza | Ubicación | Notas |
|---|---|---|
| **Landing pública** | [app/creditos/page.tsx](app/creditos/page.tsx) | Hero, tipos de crédito, buscador simple (client-side sobre datos estáticos) |
| **Simulador tradicional** | [app/creditos/simulador/page.tsx](app/creditos/simulador/page.tsx) | Formulario → llama a `/api/simulate` |
| **Cálculo de cuota (real, determinístico)** | [lib/credit-calculator.ts](lib/credit-calculator.ts) | Amortización francesa. Lo usan **tanto** el simulador como el chatbot — el LLM nunca calcula la cuota |
| **Chatbot flotante (UI)** | [components/ChatWidget.tsx](components/ChatWidget.tsx) | Widget cliente, se monta en el layout de `/creditos` |
| **Chatbot (backend + Claude)** | [app/api/chat/route.ts](app/api/chat/route.ts) | Usa `@anthropic-ai/sdk` con tool use: Claude solo conversa y decide cuándo llamar a la herramienta `calcular_simulacion`, que ejecuta el mismo cálculo determinístico de `lib/credit-calculator.ts` |
| **Tracking first-party** | [lib/tracking-client.ts](lib/tracking-client.ts), [components/Tracker.tsx](components/Tracker.tsx) | Cookie propia (`h30x_cid`, sin terceros) + `sessionStorage` para el `sessionId` de la pestaña actual |
| **API de tracking** | [app/api/session/route.ts](app/api/session/route.ts), [app/api/track/route.ts](app/api/track/route.ts) | Crea/actualiza `User` + `Session`, registra `Event` |
| **Motor de scoring** | [lib/scoring.ts](lib/scoring.ts) | `recalculateScoreForUser` recorre los eventos del usuario, suma puntos según `ScoringRule` y recalcula `IntentScore` (se corre automáticamente después de cada evento nuevo) |
| **Dashboard interno (leads)** | [app/dashboard/page.tsx](app/dashboard/page.tsx), [app/dashboard/[userId]/page.tsx](app/dashboard/[userId]/page.tsx) | Tabla de usuarios por score + timeline de eventos. **Sin autenticación** — es solo para la demo |

### Portal de colaboradores (`/colaboradores`)

| Pieza | Ubicación | Notas |
|---|---|---|
| **Login** | [app/colaboradores/login/page.tsx](app/colaboradores/login/page.tsx) | Gate simulado (cualquier cédula/contraseña) — no valida credenciales reales, solo setea una cookie `h30x_staff` |
| **Búsqueda por cédula** | [app/colaboradores/page.tsx](app/colaboradores/page.tsx), [components/SearchByCedula.tsx](components/SearchByCedula.tsx) | Buscador + listado completo de colaboradores sembrados |
| **Perfil del colaborador** | [app/colaboradores/[cedula]/page.tsx](app/colaboradores/%5Bcedula%5D/page.tsx) | Datos del empleado (cédula, nombre, empresa, antigüedad, rol, salario, correo, edad, hijos, género) + actividad en `colsubsidio.com/creditos` si se detectó (timeline de eventos + fuente de la visita: orgánico, anuncio de Facebook/Instagram, etc.) |
| **Enriquecimiento de redes (real)** | [lib/ensembledata.ts](lib/ensembledata.ts), [lib/socialcrawl.ts](lib/socialcrawl.ts), [app/api/colaboradores/enriquecer/route.ts](app/api/colaboradores/enriquecer/route.ts), [components/EnrichmentPanel.tsx](components/EnrichmentPanel.tsx) | Combina dos APIs reales: **EnsembleData** busca por nombre (Instagram `search` + TikTok `userSearch`) y descubre un username candidato; **SocialCrawl** (`/v1/{tiktok,instagram}/profile`) trae un perfil más completo (bio, verificado, seguidores, engagement) para ese mismo username. Como los colaboradores son sintéticos, cualquier resultado es una **coincidencia por nombre, no una identidad verificada** — así se etiqueta explícitamente en la UI |
| **Probabilidad por producto** | [lib/product-scoring.ts](lib/product-scoring.ts), [app/api/colaboradores/recalcular/route.ts](app/api/colaboradores/recalcular/route.ts), [components/ProductScorePanel.tsx](components/ProductScorePanel.tsx) | Reglas determinísticas (sin LLM) que estiman % de interés en 5 productos: cupo de crédito, consumo, vivienda, Línea Mujer, educativo — a partir de datos del empleado + su actividad en el sitio |
| **Datos sintéticos de empleados** | [scripts/seed.ts](scripts/seed.ts) | Genera ~50 colaboradores ficticios (cédula, nombre, empresa afiliada, salario, edad, hijos, género); ~35% se vinculan a un usuario ya sembrado del sitio público para simular "este colaborador sí visitó creditos" |
| **Schema de datos** | [prisma/schema.prisma](prisma/schema.prisma) | SQLite vía Prisma — cero configuración de infraestructura |

## Qué es real vs. simulado

- **Real:** el cálculo de la cuota (amortización francesa), el tracking de eventos, el motor
  de scoring, la capa conversacional del chatbot (Claude), las llamadas a EnsembleData y
  SocialCrawl en el portal de colaboradores, y el motor de probabilidad por producto.
- **Simulado / sintético:** todos los usuarios, empleados, cédulas, salarios, correos y
  eventos (generados por `npm run seed`) — no representan personas reales. La marca
  Colsubsidio es real (demo interno autorizado), pero **ningún dato de este sitio corresponde
  a un cliente o colaborador real**, y ninguna simulación es una preaprobación real de crédito.
- **Importante sobre el enriquecimiento de redes:** al ser nombres sintéticos, cualquier match
  de Instagram/TikTok es una coincidencia de nombre, no una persona verificada — puede (y
  probablemente va a) corresponder a un tercero real sin ninguna relación con Colsubsidio. La
  UI lo etiqueta explícitamente para evitar confusiones.

## Reglas de scoring (semilla inicial)

| Evento | Puntos |
|---|---|
| `page_view` | 5 |
| `search` | 10 |
| `simulator_use` | 15 |
| `form_abandon` | 20 |
| `form_complete` | 30 |
| `chatbot_simulacion` | 40 |

`leadStatus`: `frio` (&lt;20) · `tibio` (20–49) · `caliente` (&gt;=50).

## Variables de entorno

Ver [.env.example](.env.example):

- `ANTHROPIC_API_KEY` — clave de la API de Anthropic (https://console.anthropic.com/), usada solo por `/api/chat`.
- `ANTHROPIC_MODEL` — modelo de Claude para la capa conversacional (default: `claude-opus-4-8`).
- `ENSEMBLEDATA_API_TOKEN` — token de https://ensembledata.com, usado por el enriquecimiento de redes del portal de colaboradores.
- `SOCIALCRAWL_API_KEY` — API key de https://www.socialcrawl.dev, usada para completar el perfil (bio, verificado, seguidores, engagement) del username encontrado por EnsembleData.
- `POSTGRES_PRISMA_URL` — connection string **pooled** (vía pgbouncer) que usa la app en runtime. Es el nombre exacto que Vercel inyecta al conectar el storage Postgres — no hace falta renombrarla.
- `POSTGRES_URL_NON_POOLING` — connection string **directa** (sin pooler), usada solo por `prisma migrate` para aplicar el schema. También la inyecta Vercel automáticamente.

## Desplegar en Vercel

1. **Crear la base de datos.** En el proyecto de Vercel: `Storage` → `Create Database` →
   `Postgres` → `Connect to Project`. Esto inyecta `POSTGRES_PRISMA_URL` y
   `POSTGRES_URL_NON_POOLING` automáticamente — no hay que tocarlas a mano.
2. **Agregar el resto de las variables** en `Project Settings` → `Environment Variables`:
   `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ENSEMBLEDATA_API_TOKEN`, `SOCIALCRAWL_API_KEY`.
   (El `.env` local nunca se sube al repo — por diseño — así que este paso es manual.)
3. **Traer las variables reales a tu máquina** (para generar la migración inicial y sembrar
   datos de prueba):
   ```bash
   npx vercel link          # vincula esta carpeta con el proyecto de Vercel
   npx vercel env pull .env # trae POSTGRES_* y el resto de las variables reales
   ```
4. **Generar y aplicar la migración inicial contra la base real** (una sola vez):
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```
   Commiteá la carpeta `prisma/migrations/` generada — a partir de acá, cada deploy en
   Vercel corre `prisma migrate deploy` automáticamente (ver `vercel-build` en
   `package.json`), así que no hace falta repetir este paso a mano en cada push.
5. **Deploy.** Push a `main` (o `vercel --prod`) y listo.

Notas de la config de Vercel ya resueltas en el código: `vercel-build` encadena
`prisma generate && prisma migrate deploy && next build`; las rutas `/api/chat` y
`/api/colaboradores/enriquecer` declaran `export const maxDuration = 60` porque encadenan
varias llamadas externas (Claude, EnsembleData, SocialCrawl) y podrían superar el timeout
default de una función serverless.

## Notas

- El proyecto pasó de SQLite a Postgres específicamente para poder desplegarse en Vercel
  (ver arriba). Esto significa que **ya no hay modo "cero infraestructura"** para correr
  local — hace falta una connection string real de Postgres incluso para `npm run dev`.
- El proyecto usa Next.js 14.2.x (última versión de la rama 14, pedida explícitamente
  para este demo). Hay CVEs conocidos de Next.js sin parche dentro de la rama 14 —
  aceptable para un demo de hackathon, pero no usar este setup tal cual en producción.
- Ni el dashboard interno ni el portal de colaboradores tienen autenticación real —
  es intencional para la demo.
- El enriquecimiento de redes consume las APIs reales de EnsembleData y SocialCrawl (cuentan
  contra tu cupo/plan de cada una; SocialCrawl factura por llamada — cada búsqueda gasta
  créditos en ambas plataformas).
