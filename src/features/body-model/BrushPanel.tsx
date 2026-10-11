import { useAppStore } from '@/app/store';
import { BURN_DEPTHS } from '@/data/depths';
import type { Coverage, ScqMethod } from '@/shared/types/clinical';
import type { Brush, BrushDepth } from './painting';

const FRACTIONS = [
  { key: 'full', label: 'Completa', coverage: { kind: 'full' } as Coverage },
  { key: '0.75', label: '¾', coverage: { kind: 'fraction', value: 0.75 } as Coverage },
  { key: '0.5', label: '½', coverage: { kind: 'fraction', value: 0.5 } as Coverage },
  { key: '0.25', label: '¼', coverage: { kind: 'fraction', value: 0.25 } as Coverage },
] as const;

const MAX_PALMS = 20;

function coverageKey(coverage: Coverage): string {
  if (coverage.kind === 'full') return 'full';
  if (coverage.kind === 'palms') return 'palms';
  return String(coverage.value);
}

interface BrushPanelProps {
  method: ScqMethod;
}

/** Elige la profundidad y cuánto de cada zona se marca al pintar. */
export function BrushPanel({ method }: BrushPanelProps) {
  const brush = useAppStore((s) => s.brush);
  const setBrush = useAppStore((s) => s.setBrush);

  const update = (next: Partial<Brush>) => setBrush({ ...brush, ...next });
  const palms = brush.coverage.kind === 'palms' ? brush.coverage.count : 1;
  const selectedKey = coverageKey(brush.coverage);
  const erasing = brush.depth === 'erase';

  return (
    <div className="stack stack--tight">
      <fieldset className="brush">
        <legend className="field__label">Profundidad</legend>
        <div className="brush__options">
          {BURN_DEPTHS.map((depth) => (
            <label
              key={depth.id}
              className={`brush__option ${brush.depth === depth.id ? 'is-selected' : ''}`.trim()}
            >
              <input
                type="radio"
                name="brush-depth"
                checked={brush.depth === depth.id}
                onChange={() => update({ depth: depth.id as BrushDepth })}
              />
              <span className="swatch" style={{ background: depth.color }} aria-hidden />
              <span>
                {depth.label}
                {!depth.countsForScq && <small> · no suma</small>}
              </span>
            </label>
          ))}
          <label className={`brush__option ${erasing ? 'is-selected' : ''}`.trim()}>
            <input
              type="radio"
              name="brush-depth"
              checked={erasing}
              onChange={() => update({ depth: 'erase' })}
            />
            <span className="swatch swatch--erase" aria-hidden>
              ✕
            </span>
            <span>Borrar</span>
          </label>
        </div>
      </fieldset>

      {!erasing && (
        <fieldset className="brush">
          <legend className="field__label">Cuánto de la zona se marca</legend>
          <div className="brush__options brush__options--row">
            {FRACTIONS.map((fraction) => (
              <label
                key={fraction.key}
                className={`brush__option ${selectedKey === fraction.key ? 'is-selected' : ''}`.trim()}
              >
                <input
                  type="radio"
                  name="brush-coverage"
                  checked={selectedKey === fraction.key}
                  onChange={() => update({ coverage: fraction.coverage })}
                />
                <span>{fraction.label}</span>
              </label>
            ))}
            {method === 'rule_of_nine' && (
              <label
                className={`brush__option ${selectedKey === 'palms' ? 'is-selected' : ''}`.trim()}
              >
                <input
                  type="radio"
                  name="brush-coverage"
                  checked={selectedKey === 'palms'}
                  onChange={() => update({ coverage: { kind: 'palms', count: palms } })}
                />
                <span>Palmas</span>
              </label>
            )}
          </div>

          {method === 'rule_of_nine' && selectedKey === 'palms' && (
            <div className="stepper" role="group" aria-label="Cantidad de palmas">
              <button
                type="button"
                className="btn btn--ghost"
                aria-label="Quitar una palma"
                disabled={palms <= 1}
                onClick={() => update({ coverage: { kind: 'palms', count: palms - 1 } })}
              >
                −
              </button>
              <output className="stepper__value">
                {palms} {palms === 1 ? 'palma' : 'palmas'} = {palms} %
              </output>
              <button
                type="button"
                className="btn btn--ghost"
                aria-label="Agregar una palma"
                disabled={palms >= MAX_PALMS}
                onClick={() => update({ coverage: { kind: 'palms', count: palms + 1 } })}
              >
                +
              </button>
            </div>
          )}
          {method === 'rule_of_nine' && (
            <p className="field__hint">
              Palma = la mano del paciente con los dedos juntos (1 % de su superficie). Usa
              «Completa» para marcar el bloque entero.
            </p>
          )}
        </fieldset>
      )}
    </div>
  );
}
