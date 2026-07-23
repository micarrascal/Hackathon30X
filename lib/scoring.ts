import { prisma } from "./prisma";

export type LeadStatus = "frio" | "tibio" | "caliente";

export function statusFromScore(score: number): LeadStatus {
  if (score >= 50) return "caliente";
  if (score >= 20) return "tibio";
  return "frio";
}

// Recorre todos los eventos de un usuario y recalcula su IntentScore
// aplicando las ScoringRule vigentes. Se corre cada vez que se registra un evento nuevo:
// es simple (recorre todo el historial) en vez de incremental, suficiente para el volumen de una demo.
export async function recalculateScoreForUser(userId: string) {
  const [events, rules] = await Promise.all([
    prisma.event.findMany({ where: { userId } }),
    prisma.scoringRule.findMany(),
  ]);

  let score = 0;
  for (const event of events) {
    for (const rule of rules) {
      if (rule.eventType !== event.eventType) continue;
      if (rule.pagePattern && !(event.pageUrl ?? "").includes(rule.pagePattern)) continue;
      score += rule.points;
    }
  }

  const leadStatus = statusFromScore(score);

  const intentScore = await prisma.intentScore.upsert({
    where: { userId },
    update: { currentScore: score, scoreUpdatedAt: new Date(), leadStatus },
    create: { userId, currentScore: score, leadStatus },
  });

  return intentScore;
}
