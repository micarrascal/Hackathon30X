# Hackathon30X — CajaCrédito Demo

Demo de hackathon: un sitio de créditos ficticio ("CajaCrédito Demo") que detecta
**intención de solicitud de crédito** combinando tracking de comportamiento first-party
con un chatbot conversacional que simula un crédito. **No es un producto real ni de
producción** — no representa a Colsubsidio ni a ninguna caja de compensación real; toda
la marca, nombre y datos son ficticios/sintéticos.

## Cómo correrlo

Requisitos: Node.js 18+.

```bash
npm install          # instala dependencias y corre `prisma generate`
cp .env.example .env # completá ANTHROPIC_API_KEY con tu clave (ver mas abajo)
npx prisma migrate dev --name init   # crea prisma/dev.db con el schema (solo la primera vez)
npm run seed          # genera ~50 usuarios sinteticos con historiales de eventos
npm run dev            # http://localhost:3000 (redirige a /creditos)
```

No hay pasos manuales adicionales más allá de eso. Si `prisma/dev.db` ya existe (por
ejemplo, en un clon del repo), `npx prisma migrate dev` la deja al día sin pedir nada más.

Sin `ANTHROPIC_API_KEY`, todo el sitio funciona igual (landing, simulador, dashboard) —
solo el chatbot responde con un mensaje avisando que no está disponible.

## Dónde está cada pieza

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
| **Dashboard interno** | [app/dashboard/page.tsx](app/dashboard/page.tsx), [app/dashboard/[userId]/page.tsx](app/dashboard/[userId]/page.tsx) | Tabla de usuarios por score + timeline de eventos por usuario. **Sin autenticación** — es solo para la demo |
| **Datos sintéticos** | [scripts/seed.ts](scripts/seed.ts) | Genera ~50 usuarios con historiales variados (algunos con 1 visita, otros con 5+, algunos usaron el simulador o el chatbot, algunos abandonaron el formulario) |
| **Schema de datos** | [prisma/schema.prisma](prisma/schema.prisma) | SQLite vía Prisma — cero configuración de infraestructura |

## Qué es real vs. simulado

- **Real:** el cálculo de la cuota (amortización francesa), el tracking de eventos, el
  motor de scoring, la capa conversacional del chatbot (llama a la API de Claude de
  verdad si configurás `ANTHROPIC_API_KEY`).
- **Simulado / ficticio:** la marca "CajaCrédito Demo" (no representa a ninguna empresa
  real), los usuarios y eventos generados por `npm run seed`, la tasa de interés fija
  usada en el cálculo (18% E.A., solo para fines de demo), y por supuesto: **ninguna
  simulación de este sitio es una preaprobación real de crédito.**

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
- `DATABASE_URL` — conexión SQLite para Prisma (`file:./prisma/dev.db`).

## Notas

- El proyecto usa Next.js 14.2.x (última versión de la rama 14, pedida explícitamente
  para este demo). Hay CVEs conocidos de Next.js sin parche dentro de la rama 14 —
  aceptable para un demo de hackathon, pero no usar este setup tal cual en producción.
- El dashboard interno no tiene autenticación real — es intencional para la demo.
