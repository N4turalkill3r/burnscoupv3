import { recommendationRules } from '@/data/recommendationRules';
import type { RecommendationContext, Recommendation } from '@/data/recommendationRules';

/** Devuelve las recomendaciones del protocolo que aplican al contexto, ordenadas por prioridad. */
export function buildRecommendations(ctx: RecommendationContext): Recommendation[] {
  return recommendationRules
    .filter((rule) => rule.appliesWhen(ctx))
    .map((rule) => ({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      title: rule.title,
      details: typeof rule.details === 'function' ? rule.details(ctx) : rule.details,
      source: rule.source,
    }))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

const SEVERITY_ORDER = { critical: 0, important: 1, info: 2 } as const;
