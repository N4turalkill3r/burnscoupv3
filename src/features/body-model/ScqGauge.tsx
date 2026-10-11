import type { ScqResult } from '@/features/burn-calculation/scq';
import { formatPercent } from '@/shared/utils/format';

interface ScqGaugeProps {
  scq: ScqResult;
  /** Umbral de SCQ para la edad; null si todavía no hay edad válida. */
  threshold: { percent: number; label: string } | null;
}

/** Medidor de la SCQ de fluidoterapia (2.º + 3.er grado) con el umbral de la edad. */
export function ScqGauge({ scq, threshold }: ScqGaugeProps) {
  const scaleMax = Math.max(30, (threshold?.percent ?? 0) * 1.6, scq.total * 1.15);
  const exceeded = threshold !== null && scq.total > threshold.percent;
  const fill = Math.min(100, (scq.total / scaleMax) * 100);

  return (
    <div className={`gauge ${exceeded ? 'gauge--over' : ''}`.trim()}>
      <div className="gauge__head">
        <div>
          <p className="gauge__label">SCQ para fluidoterapia</p>
          <p className="gauge__value" aria-live="polite">
            {formatPercent(scq.total)}
          </p>
        </div>
        {threshold && (
          <p className="gauge__status">
            {exceeded ? 'Supera el umbral' : 'Bajo el umbral'} de{' '}
            {formatPercent(threshold.percent, 0)}
            <span className="gauge__status-sub">{threshold.label}</span>
          </p>
        )}
      </div>

      <div
        className="gauge__bar"
        role="meter"
        aria-label="Superficie corporal quemada"
        aria-valuemin={0}
        aria-valuemax={Math.round(scaleMax)}
        aria-valuenow={Math.round(scq.total * 10) / 10}
      >
        <div className="gauge__fill" style={{ width: `${fill}%` }} />
        {threshold && (
          <div
            className="gauge__marker"
            style={{ left: `${Math.min(100, (threshold.percent / scaleMax) * 100)}%` }}
            title={`Umbral ${threshold.percent} %`}
          />
        )}
      </div>

      <dl className="gauge__breakdown">
        <div>
          <dt>2.º superficial</dt>
          <dd>{formatPercent(scq.secondSuperficial)}</dd>
        </div>
        <div>
          <dt>2.º profundo</dt>
          <dd>{formatPercent(scq.secondDeep)}</dd>
        </div>
        <div>
          <dt>3.er grado</dt>
          <dd>{formatPercent(scq.third)}</dd>
        </div>
        <div className="is-muted">
          <dt>1.er grado (no suma)</dt>
          <dd>{formatPercent(scq.first)}</dd>
        </div>
      </dl>
    </div>
  );
}
