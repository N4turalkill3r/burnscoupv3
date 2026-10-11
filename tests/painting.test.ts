import { describe, expect, it } from 'vitest';
import { coverageLabel, DEFAULT_BRUSH, paintZone } from '@/features/body-model/painting';
import type { BurnMap } from '@/shared/types/clinical';

describe('paintZone', () => {
  it('marca una zona con la profundidad y la cobertura del pincel', () => {
    const map = paintZone({}, 'thigh_r', {
      depth: 'third',
      coverage: { kind: 'fraction', value: 0.5 },
    });
    expect(map.thigh_r).toEqual({ depth: 'third', coverage: { kind: 'fraction', value: 0.5 } });
  });

  it('no modifica el mapa original', () => {
    const original: BurnMap = {};
    paintZone(original, 'head', DEFAULT_BRUSH);
    expect(original).toEqual({});
  });

  it('devuelve el mismo objeto si el pincel no cambia nada (evita renderizados al arrastrar)', () => {
    const once = paintZone({}, 'head', DEFAULT_BRUSH);
    expect(paintZone(once, 'head', DEFAULT_BRUSH)).toBe(once);
  });

  it('reemplaza la marca anterior de la zona', () => {
    const first = paintZone({}, 'head', DEFAULT_BRUSH);
    const second = paintZone(first, 'head', { depth: 'first', coverage: { kind: 'full' } });
    expect(second.head?.depth).toBe('first');
  });

  it('borrar quita la zona y es inocuo si no estaba marcada', () => {
    const marked = paintZone({}, 'head', DEFAULT_BRUSH);
    const erased = paintZone(marked, 'head', { depth: 'erase', coverage: { kind: 'full' } });
    expect(erased.head).toBeUndefined();

    const empty: BurnMap = {};
    expect(paintZone(empty, 'head', { depth: 'erase', coverage: { kind: 'full' } })).toBe(empty);
  });

  it('distingue palmas distintas como cambios', () => {
    const a = paintZone({}, 'upper_back', {
      depth: 'second_deep',
      coverage: { kind: 'palms', count: 2 },
    });
    const b = paintZone(a, 'upper_back', {
      depth: 'second_deep',
      coverage: { kind: 'palms', count: 3 },
    });
    expect(b).not.toBe(a);
    expect(b.upper_back?.coverage).toEqual({ kind: 'palms', count: 3 });
  });
});

describe('coverageLabel', () => {
  it('describe cada tipo de cobertura', () => {
    expect(coverageLabel({ kind: 'full' })).toBe('Bloque completo');
    expect(coverageLabel({ kind: 'fraction', value: 0.25 })).toBe('25 % de la zona');
    expect(coverageLabel({ kind: 'palms', count: 1 })).toBe('1 palma');
    expect(coverageLabel({ kind: 'palms', count: 3 })).toBe('3 palmas');
  });
});
