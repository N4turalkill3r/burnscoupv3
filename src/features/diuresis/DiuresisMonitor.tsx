import { useAppStore } from '@/app/store';
import { Card } from '@/shared/components/Card';
import { NumberField } from '@/shared/components/NumberField';
import { formatNumber } from '@/shared/utils/format';
import type { Assessment } from '@/features/burn-calculation/assessment';
import { assessDiuresis, type TrafficLight } from './diuresis';

const LIGHT_ICON: Record<TrafficLight, string> = { red: '▼', green: '✔', yellow: '▲' };
const LIGHT_NAME: Record<TrafficLight, string> = {
  red: 'Rojo',
  green: 'Verde',
  yellow: 'Amarillo',
};

interface DiuresisMonitorProps {
  assessment: Assessment;
  weightKg: number;
}

/** Diuresis esperada, campo para la diuresis real y semáforo con la conducta del protocolo. */
export function DiuresisMonitor({ assessment, weightKg }: DiuresisMonitorProps) {
  const actual = useAppStore((s) => s.actualDiuresisMlH);
  const setActual = useAppStore((s) => s.setActualDiuresis);
  const log = useAppStore((s) => s.diuresisLog);
  const addEntry = useAppStore((s) => s.addDiuresisEntry);
  const removeEntry = useAppStore((s) => s.removeDiuresisEntry);
  const target = assessment.diuresisTarget;
  const currentRate = assessment.schedule?.blocks[0]?.rateMlPerHour ?? null;

  const result =
    actual !== null && actual >= 0
      ? assessDiuresis({
          actualMlPerHour: actual,
          weightKg,
          target,
          currentRateMlPerHour: currentRate,
        })
      : null;

  return (
    <Card
      title="Diuresis"
      description={
        target.mode === 'myoglobinuria'
          ? 'Eléctrica con orina pigmentada: meta propia hasta que la orina aclare.'
          : 'Controla la diuresis cada hora y ajusta la infusión.'
      }
    >
      <div className="stack">
        <p className="diuresis-target">
          Diuresis esperada:{' '}
          <strong>
            {target.mode === 'myoglobinuria'
              ? `${formatNumber(target.minMlPerHour, 0)} a ${formatNumber(target.maxMlPerHour, 0)} ml/h`
              : `${formatNumber(target.minMlPerHour, 0)} ml/h o más`}
          </strong>{' '}
          <span className="muted">
            ({target.description}, para {formatNumber(weightKg, 1)} kg)
          </span>
        </p>

        <NumberField
          label="Diuresis real de la última hora"
          unit="ml/h"
          value={actual}
          onChange={setActual}
          hint="Volumen de orina de la última hora (sonda Foley)."
        />

        {result ? (
          <div className={`traffic traffic--${result.light}`} role="status">
            <span className="traffic__icon" aria-hidden>
              {LIGHT_ICON[result.light]}
            </span>
            <div>
              <p className="traffic__title">
                <span className="traffic__name">{LIGHT_NAME[result.light]}:</span> {result.title}
              </p>
              <p>{result.message}</p>
              <p>
                <strong>Conducta:</strong> {result.conduct}
              </p>
              {result.suggestedRateRange && currentRate && (
                <p>
                  Velocidad actual {formatNumber(currentRate, 0)} ml/h → entre{' '}
                  <strong>{formatNumber(result.suggestedRateRange.min, 0)}</strong> y{' '}
                  <strong>{formatNumber(result.suggestedRateRange.max, 0)} ml/h</strong>.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">Ingresa la diuresis real para ver si va por buen camino.</p>
        )}

        {result && actual !== null && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              addEntry({
                at: new Date().toISOString(),
                mlPerHour: actual,
                mlPerKgH: actual / weightKg,
                light: result.light,
              })
            }
          >
            Registrar esta lectura
          </button>
        )}

        {log.length > 0 && (
          <div className="stack stack--tight">
            <h3 className="log__title">Lecturas registradas</h3>
            <ul className="log">
              {[...log].reverse().map((entry) => (
                <li key={entry.id} className={`log__item log__item--${entry.light}`}>
                  <span className="log__time">
                    {new Date(entry.at).toLocaleTimeString('es-SV', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>
                    {formatNumber(entry.mlPerHour, 0)} ml/h ({formatNumber(entry.mlPerKgH, 2)}{' '}
                    ml/kg/h)
                  </span>
                  <span className="log__light">
                    {LIGHT_ICON[entry.light]} {LIGHT_NAME[entry.light]}
                  </span>
                  <button
                    type="button"
                    className="link-button"
                    aria-label="Quitar lectura"
                    onClick={() => removeEntry(entry.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
