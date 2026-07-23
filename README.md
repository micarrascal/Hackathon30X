# Hackathon30X — Portal de créditos Colsubsidio

Demo de **hackathon interno de Colsubsidio** que detecta **intención de solicitud de crédito**
combinando tracking de comportamiento first-party, un chatbot conversacional que simula un
crédito, y un portal interno de colaboradores con enriquecimiento y probabilidad de producto.

**La marca es real (Colsubsidio), pero todos los datos son sintéticos**: usuarios, eventos,
empleados, cédulas, salarios y correos son generados por `npm run seed` — no corresponden a
personas reales ni a información real de RR.HH. de Colsubsidio. **No es un producto de
producción.**

## Cómo correrlo

Requisitos: Node.js 18+.

```bash
npm install          # instala dependencias y corre `prisma generate`
cp .env.example .env  # completá ANTHROPIC_API_KEY y ENSEMBLEDATA_API_TOKEN (ver mas abajo)
npx prisma migrate dev --name init   # crea prisma/dev.db con el schema (solo la primera vez)
npm run seed           # genera ~50 usuarios + ~50 colaboradores sinteticos
npm run dev             # http://localhost:3000 (redirige a /creditos)
```

No hay pasos manuales adicionales más allá de eso. Si `prisma/dev.db` ya existe (por
ejemplo, en un clon del repo), `npx prisma migrate dev` la deja al día sin pedir nada más.

Sin `ANTHROPIC_API_KEY` o sin `ENSEMBLEDATA_API_TOKEN`, el resto del sitio funciona igual —
el chatbot y el botón "Buscar en redes" del portal de colaboradores simplemente avisan que
esa integración no está configurada.

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
- `DATABASE_URL` — conexión SQLite para Prisma (`file:./prisma/dev.db`).

## Notas

- El proyecto usa Next.js 14.2.x (última versión de la rama 14, pedida explícitamente
  para este demo). Hay CVEs conocidos de Next.js sin parche dentro de la rama 14 —
  aceptable para un demo de hackathon, pero no usar este setup tal cual en producción.
- Ni el dashboard interno ni el portal de colaboradores tienen autenticación real —
  es intencional para la demo.
- El enriquecimiento de redes consume las APIs reales de EnsembleData y SocialCrawl (cuentan
  contra tu cupo/plan de cada una; SocialCrawl factura por llamada — cada búsqueda gasta
  créditos en ambas plataformas).
