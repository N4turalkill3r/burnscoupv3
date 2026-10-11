import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/app/store';
import { useAssessment } from '@/app/useAssessment';
import { ZONE_LABEL } from '@/data/zones';
import {
  BODY_MODEL_LABEL,
  isValidAge,
  lundBrowderColumnForModel,
  proportionAgeForModel,
} from '@/features/burn-calculation/age';
import { initialRateBandLabel, initialRateMlPerHour } from '@/features/burn-calculation/parkland';
import { calculateScq, zoneValues as computeZoneValues } from '@/features/burn-calculation/scq';
import { scqThresholdForAge } from '@/features/burn-calculation/thresholds';
import { Callout } from '@/shared/components/Callout';
import { Card } from '@/shared/components/Card';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { Segmented } from '@/shared/components/Segmented';
import type { ScqMethod, ZoneId } from '@/shared/types/clinical';
import { formatNumber } from '@/shared/utils/format';
import { isWebGLAvailable } from '@/shared/utils/webgl';
import type { ViewerMode, ViewName, ViewRequest } from './BodyViewer';
import { BrushPanel } from './BrushPanel';
import { ScqGauge } from './ScqGauge';
import { ZoneList } from './ZoneList';

// El visor 3D (three.js) se descarga sólo cuando se abre esta pantalla.
const BodyViewer = lazy(() => import('./BodyViewer'));

const METHOD_OPTIONS = [
  { value: 'lund_browder', label: 'Lund-Browder', description: 'Por regiones, según la edad' },
  {
    value: 'rule_of_nine',
    label: 'Regla de los nueve',
    description: 'Bloques de 9 %; palma = 1 %',
  },
] as const;

const NO_3D = (
  <Callout tone="warning" title="No se puede mostrar el modelo 3D">
    Este dispositivo no tiene WebGL activo. Marca las quemaduras con la lista de zonas.
  </Callout>
);

export function BurnsStep() {
  const age = useAppStore((s) => s.age);
  const method = useAppStore((s) => s.method);
  const burns = useAppStore((s) => s.burnsByMethod[s.method]);
  const setMethod = useAppStore((s) => s.setMethod);
  const paint = useAppStore((s) => s.paint);
  const clearZone = useAppStore((s) => s.clearZone);
  const clearBurns = useAppStore((s) => s.clearBurns);
  const goTo = useAppStore((s) => s.goTo);
  const { model } = useAssessment();

  const [mode, setMode] = useState<ViewerMode>('paint');
  const [viewRequest, setViewRequest] = useState<ViewRequest>({ view: 'front', nonce: 0 });
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [webgl] = useState(isWebGLAvailable);

  const validAge = isValidAge(age) ? age : null;
  const proportionAge = model ? proportionAgeForModel(model, age) : null;
  const column = model ? lundBrowderColumnForModel(model, age) : null;

  const values = useMemo(
    () =>
      proportionAge !== null && column !== null
        ? computeZoneValues(method, { age: proportionAge, column })
        : {},
    [method, proportionAge, column],
  );
  const scq = useMemo(
    () =>
      proportionAge !== null && column !== null
        ? calculateScq(method, burns, { age: proportionAge, column })
        : null,
    [method, burns, proportionAge, column],
  );
  const threshold = validAge !== null ? scqThresholdForAge(validAge) : null;

  const requestView = useCallback(
    (view: ViewName) => setViewRequest((r) => ({ view, nonce: r.nonce + 1 })),
    [],
  );

  if (!model || !scq) {
    return (
      <Callout tone="warning" title="Falta elegir el modelo corporal">
        <p>Indica la edad del paciente o elige un modelo para poder pintar las quemaduras.</p>
        <button type="button" className="btn" onClick={() => goTo('patient')}>
          Ir a datos del paciente
        </button>
      </Callout>
    );
  }

  const selectMethod = (next: ScqMethod) => setMethod(next);
  const hoveredValue = hoveredZone ? values[hoveredZone] : undefined;
  const hasMarks = Object.keys(burns).length > 0;

  return (
    <div className="burns">
      <div className="burns__viewer">
        <div className="viewer-toolbar">
          <div className="inline" role="group" aria-label="Vista del modelo">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => requestView('front')}
              aria-pressed={viewRequest.view === 'front'}
            >
              Frente
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => requestView('back')}
              aria-pressed={viewRequest.view === 'back'}
            >
              Espalda
            </button>
          </div>
          <div className="inline" role="group" aria-label="Qué hace el dedo o el cursor">
            <button
              type="button"
              className={`btn btn--ghost ${mode === 'paint' ? 'is-active' : ''}`.trim()}
              aria-pressed={mode === 'paint'}
              onClick={() => setMode('paint')}
            >
              Pintar
            </button>
            <button
              type="button"
              className={`btn btn--ghost ${mode === 'rotate' ? 'is-active' : ''}`.trim()}
              aria-pressed={mode === 'rotate'}
              onClick={() => setMode('rotate')}
            >
              Girar
            </button>
          </div>
        </div>

        <div className={`viewer viewer--${mode}`}>
          {webgl ? (
            <ErrorBoundary fallback={NO_3D}>
              <Suspense fallback={<p className="viewer__loading">Cargando modelo 3D…</p>}>
                <BodyViewer
                  model={model}
                  method={method}
                  burns={burns}
                  zoneValues={values}
                  mode={mode}
                  viewRequest={viewRequest}
                  hoveredZone={hoveredZone}
                  onHoverZone={setHoveredZone}
                  onPaintZone={paint}
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
            NO_3D
          )}
          <p className="viewer__tooltip" aria-live="polite">
            {hoveredZone
              ? `${ZONE_LABEL[hoveredZone]}${
                  hoveredValue !== undefined ? ` · ${formatNumber(hoveredValue, 2)} %` : ''
                }`
              : mode === 'paint'
                ? 'Toca o arrastra sobre el cuerpo para pintar'
                : 'Arrastra para girar el modelo'}
          </p>
        </div>

        <p className="viewer__model">
          Modelo: <strong>{BODY_MODEL_LABEL[model]}</strong>{' '}
          <button type="button" className="link-button" onClick={() => goTo('patient')}>
            Cambiar
          </button>
        </p>

        <div className="burns__gauge">
          <ScqGauge
            scq={scq}
            threshold={threshold && { percent: threshold.thresholdPercent, label: threshold.label }}
          />
        </div>
      </div>

      <div className="burns__panel stack">
        {validAge !== null && (
          <Callout tone="info" title="Antes de calcular">
            Si la lesión parece severa (más de 20 % de SCQ), inicia Ringer Lactato a{' '}
            <strong>{initialRateMlPerHour(validAge)} ml/h</strong> ({initialRateBandLabel(validAge)}
            ) mientras cuantificas la SCQ.
          </Callout>
        )}

        <Card title="Método de estimación">
          <Segmented
            legend="Método"
            name="scq-method"
            value={method}
            options={METHOD_OPTIONS}
            onChange={selectMethod}
          />
          <p className="field__hint">
            Cada método guarda sus propias marcas. Se calcula con el método activo.
          </p>
        </Card>

        <Card title="Pincel">
          <BrushPanel method={method} />
        </Card>

        <Card
          title="Zonas"
          description="Toca una zona para marcarla con el pincel actual."
          actions={
            hasMarks ? (
              <button type="button" className="btn btn--ghost" onClick={clearBurns}>
                Quitar todo
              </button>
            ) : null
          }
        >
          <ZoneList
            method={method}
            burns={burns}
            zoneValues={values}
            hoveredZone={hoveredZone}
            onHoverZone={setHoveredZone}
            onPaintZone={paint}
            onClearZone={clearZone}
          />
        </Card>
      </div>
    </div>
  );
}
