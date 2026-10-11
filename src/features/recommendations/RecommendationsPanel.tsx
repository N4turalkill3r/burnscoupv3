import {
  RECOMMENDATION_CATEGORY_LABEL,
  type Recommendation,
  type RecommendationCategory,
  type RecommendationSeverity,
} from '@/data/recommendationRules';
import { Card } from '@/shared/components/Card';
import type { DerivationCriterion } from './derivation';

const SEVERITY_LABEL: Record<RecommendationSeverity, string> = {
  critical: 'Crítica',
  important: 'Importante',
  info: 'Informativa',
};

/** Agrupa por categoría conservando el orden de prioridad de la primera aparición. */
function groupByCategory(items: readonly Recommendation[]) {
  const groups = new Map<RecommendationCategory, Recommendation[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return [...groups.entries()];
}

export function DerivationCard({ criteria }: { criteria: readonly DerivationCriterion[] }) {
  const needsTransfer = criteria.length > 0;
  return (
    <Card title="Derivación a unidad de quemados" className={needsTransfer ? 'card--alert' : ''}>
      {needsTransfer ? (
        <>
          <p className="derivation__verdict">
            <strong>
              Cumple {criteria.length === 1 ? 'un criterio' : `${criteria.length} criterios`}
            </strong>{' '}
            de transferencia a la Unidad de Cuidados Críticos de Quemados.
          </p>
          <ul className="derivation__list">
            {criteria.map((c) => (
              <li key={c.id}>
                {c.text}
                {c.detail && <small>{c.detail}</small>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted">
          Con los datos ingresados no se cumple ningún criterio absoluto de transferencia. Si cambia
          el cuadro, vuelve a revisarlo.
        </p>
      )}
    </Card>
  );
}

export function RecommendationsPanel({
  recommendations,
}: {
  recommendations: readonly Recommendation[];
}) {
  return (
    <Card
      title="Recomendaciones del protocolo"
      description="Se actualizan con los hallazgos, el tipo de quemadura y la SCQ."
    >
      <div className="stack">
        {groupByCategory(recommendations).map(([category, items]) => (
          <section key={category} className="rec-group">
            <h3 className="rec-group__title">{RECOMMENDATION_CATEGORY_LABEL[category]}</h3>
            {items.map((item) => (
              <details
                key={item.id}
                className={`rec rec--${item.severity}`}
                open={item.severity === 'critical'}
              >
                <summary>
                  <span className={`rec__badge rec__badge--${item.severity}`}>
                    {SEVERITY_LABEL[item.severity]}
                  </span>
                  <span className="rec__title">{item.title}</span>
                </summary>
                <ul className="rec__details">
                  {item.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
                <p className="rec__source">Protocolo: {item.source}</p>
              </details>
            ))}
          </section>
        ))}
      </div>
    </Card>
  );
}
