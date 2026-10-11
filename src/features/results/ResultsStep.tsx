import { useState } from 'react';
import { useAppStore } from '@/app/store';
import { useAssessment } from '@/app/useAssessment';
import { PARKLAND_CONSTANT_RANGE } from '@/data/fluidProtocol';
import { BODY_MODEL_LABEL } from '@/features/burn-calculation/age';
import type { Assessment } from '@/features/burn-calculation/assessment';
import { DiuresisMonitor } from '@/features/diuresis/DiuresisMonitor';
import { ScqGauge } from '@/features/body-model/ScqGauge';
import { BURN_TYPE_OPTIONS } from '@/features/patient/labels';
import {
  DerivationCard,
  RecommendationsPanel,
} from '@/features/recommendations/RecommendationsPanel';
import { Callout } from '@/shared/components/Callout';
import { Card } from '@/shared/components/Card';
import { NumberField } from '@/shared/components/NumberField';
import { formatMl, formatNumber, formatPercent } from '@/shared/utils/format';
import { clockAfter, formatHours } from '@/shared/utils/time';
import { buildSummaryText } from './summary';

const METHOD_LABEL = { lund_browder: 'Lund-Browder', rule_of_nine: 'Regla de los nueve' } as const;

export function ResultsStep() {
  const { assessment, missing, model } = useAssessment();
  const age = useAppStore((s) => s.age);
  const weightKg = useAppStore((s) => s.weightKg);
  const burnType = useAppStore((s) => s.burnType);
  const method = useAppStore((s) => s.method);
  const burnAt = useAppStore((s) => s.burnAt);
  const patientLabel = useAppStore((s) => s.patientLabel);
  const diuresisLog = useAppStore((s) => s.diuresisLog);
  const goTo = useAppStore((s) => s.goTo);

  if (!assessment || age === null || weightKg === null || !model) {
    return (
      <Callout tone="warning" title="Faltan datos para calcular">
        <p>Completa {missing.join(', ')}.</p>
        <button type="button" className="btn" onClick={() => goTo('patient')}>
          Ir a datos del paciente
        </button>
      </Callout>
    );
  }

  const burnTypeLabel = BURN_TYPE_OPTIONS.find((o) => o.value === burnType)?.label ?? burnType;
  const summaryText = buildSummaryText({
    patientLabel,
    diuresisLog,
    age,
    weightKg,
    burnTypeLabel,
    modelLabel: BODY_MODEL_LABEL[model],
    methodLabel: METHOD_LABEL[method],
    assessment,
  });

  return (
    <div className="stack">
      <Card title="Superficie corporal quemada">
        <ScqGauge
          scq={assessment.scq}
          threshold={{ percent: assessment.threshold.percent, label: assessment.threshold.label }}
        />
        {assessment.scq.total === 0 && (
          <Callout tone="info" title="Aún no hay quemaduras que sumen">
            Pinta zonas de 2.º o 3.er grado en el paso «Quemaduras». El 1.er grado no suma.
          </Callout>
        )}
      </Card>

      <DoseCard assessment={assessment} weightKg={weightKg} />
      <InfusionPlan assessment={assessment} burnAt={burnAt} />
      <DiuresisMonitor assessment={assessment} weightKg={weightKg} />
      <DerivationCard criteria={assessment.derivation} />
      <RecommendationsPanel recommendations={assessment.recommendations} />

      <Card title="Reporte">
        <CopySummary text={summaryText} />
      </Card>
    </div>
  );
}

function DoseCard({ assessment, weightKg }: { assessment: Assessment; weightKg: number }) {
  const override = useAppStore((s) => s.doseConstantOverride);
  const setOverride = useAppStore((s) => s.setDoseConstantOverride);
  const { constant } = assessment;

  return (
    <Card
      title="Dosis de Ringer Lactato en 24 h"
      description="Constante × peso × % de SCQ, contados desde la hora de la quemadura."
    >
      <div className="stack">
        <NumberField
          label="Constante"
          unit="ml/kg/%SCQ"
          value={override}
          placeholder={String(constant.defaultValue).replace('.', ',')}
          onChange={setOverride}
          hint={`El protocolo propone ${constant.defaultValue} ml. Escribe otro número si cambia la dosis.`}
          error={override !== null && override <= 0 ? 'La constante debe ser mayor que 0.' : null}
        />
        {override !== null && (
          <button type="button" className="link-button" onClick={() => setOverride(null)}>
            Usar el valor del protocolo ({constant.defaultValue})
          </button>
        )}
        {!constant.isDefault && !constant.inProtocolRange && (
          <Callout tone="warning" title="Fuera del rango del protocolo">
            El protocolo usa entre {PARKLAND_CONSTANT_RANGE.min} y {PARKLAND_CONSTANT_RANGE.max}{' '}
            ml/kg/%SCQ.
          </Callout>
        )}

        <div className="volume">
          <p className="volume__formula">
            {formatNumber(constant.value, 2)} ml × {formatNumber(weightKg, 1)} kg ×{' '}
            {formatPercent(assessment.scq.total)}
          </p>
          <p className="volume__total">{formatMl(assessment.volume24hMl)}</p>
          <p className="volume__caption">de Ringer Lactato en las primeras 24 h</p>
        </div>
      </div>
    </Card>
  );
}

function InfusionPlan({ assessment, burnAt }: { assessment: Assessment; burnAt: string }) {
  const goTo = useAppStore((s) => s.goTo);
  const { schedule, maintenance } = assessment;

  return (
    <Card title="Plan de infusión">
      <div className="stack">
        {schedule === null && (
          <Callout tone="warning" title="Faltan las horas">
            <p>Ingresa la hora de la quemadura y la de llegada para repartir el volumen.</p>
            <button type="button" className="btn" onClick={() => goTo('timing')}>
              Ir a horas
            </button>
          </Callout>
        )}

        {schedule && (schedule.status === 'invalid' || schedule.status === 'beyond_24h') && (
          <Callout tone="danger" title="No se puede repartir el volumen">
            {schedule.warnings.join(' ')}
          </Callout>
        )}

        {schedule && schedule.blocks.length > 0 && (
          <>
            {schedule.warnings.map((w) => (
              <Callout key={w} tone="warning">
                {w}
              </Callout>
            ))}
            <ol className="blocks">
              {schedule.blocks.map((block) => (
                <li key={block.id} className="block">
                  <p className="block__label">{block.label}</p>
                  <p className="block__rate">
                    {formatNumber(block.rateMlPerHour, 0)} <span>ml/h</span>
                  </p>
                  <p className="block__meta">
                    {formatMl(block.volumeMl)} en {formatHours(block.durationHours)}
                    {burnAt && (
                      <>
                        {' · '}de {clockAfter(burnAt, block.startHourFromBurn)} a{' '}
                        {clockAfter(burnAt, block.endHourFromBurn)}
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}

        {maintenance.applies && (
          <div className="maintenance">
            <p>
              <strong>
                Mantenimiento basal simultáneo: {formatNumber(maintenance.mlPerHour, 0)} ml/h
              </strong>{' '}
              de Dextrosa 5 % en Ringer Lactato (o SS 0,45 %), según Holliday-Segar.
            </p>
            {maintenance.specialCriterion && (
              <Callout tone="warning" title="Criterio especial fuera de protocolo">
                Mantenimiento basal a los 14 años: el protocolo lo indica sólo en menores de 14.
              </Callout>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function CopySummary({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 2500);
  };

  return (
    <div className="stack stack--tight">
      <pre className="summary">{text}</pre>
      <button type="button" className="btn" onClick={copy}>
        {state === 'copied' ? 'Resumen copiado' : 'Copiar resumen'}
      </button>
      {state === 'failed' && (
        <p className="field__error">No se pudo copiar. Selecciona el texto y cópialo a mano.</p>
      )}
    </div>
  );
}
