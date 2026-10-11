import { describe, expect, it } from 'vitest';
import { ruleOfNineValues } from '@/features/burn-calculation/ruleOfNines';
import { ADULT_NINES_TOTAL, calculateScq, coverageFraction } from '@/features/burn-calculation/scq';
import { LUND_BROWDER_ZONES } from '@/data/zones';
import type { BurnMap } from '@/shared/types/clinical';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe('regla de los nueve', () => {
  it('adulto: bloques de Wallace y total 100 %', () => {
    const v = ruleOfNineValues(30);
    expect(v.head_neck).toBe(9);
    expect(v.lower_limb_r).toBe(18);
    expect(v.upper_limb_l).toBe(9);
    expect(v.perineum).toBe(1);
    expect(sum(v)).toBe(100);
    expect(ADULT_NINES_TOTAL).toBe(100);
  });

  it('lactante: cabeza y cuello 18 %, cada pierna 14 %', () => {
    const v = ruleOfNineValues(1);
    expect(v.head_neck).toBe(18);
    expect(v.lower_limb_r).toBe(14);
    expect(v.lower_limb_l).toBe(14);
  });

  it('nota del PDF: −1 % a la cabeza y +0,5 % a cada pierna por cada año mayor de 1', () => {
    const v = ruleOfNineValues(3);
    expect(v.head_neck).toBe(16);
    expect(v.lower_limb_r).toBe(15);
  });

  it('tiene topes de adulto: cabeza ≥ 9 % y pierna ≤ 18 %', () => {
    for (let age = 0; age <= 14; age++) {
      const v = ruleOfNineValues(age);
      expect(v.head_neck).toBeGreaterThanOrEqual(9);
      expect(v.lower_limb_r).toBeLessThanOrEqual(18);
    }
    const v = ruleOfNineValues(12);
    expect(v.head_neck).toBe(9);
    expect(v.lower_limb_r).toBe(18);
  });

  it('el total se mantiene entre 100 y 101 % para cualquier edad', () => {
    for (let age = 0; age <= 100; age++) {
      const total = sum(ruleOfNineValues(age));
      expect(total).toBeGreaterThanOrEqual(100);
      expect(total).toBeLessThanOrEqual(101);
    }
  });
});

describe('cobertura de una zona', () => {
  it('completa, fracción y palmas (1 % cada una, con tope en el valor de la zona)', () => {
    expect(coverageFraction({ kind: 'full' }, 9)).toBe(1);
    expect(coverageFraction({ kind: 'fraction', value: 0.5 }, 9)).toBe(0.5);
    expect(coverageFraction({ kind: 'palms', count: 3 }, 9)).toBeCloseTo(3 / 9);
    expect(coverageFraction({ kind: 'palms', count: 50 }, 9)).toBe(1);
  });
});

describe('cálculo de la SCQ', () => {
  const ctx = { age: 30, column: 'adult' as const };

  it('el 1.er grado se pinta pero NO suma a la SCQ', () => {
    const burns: BurnMap = {
      trunk_anterior: { depth: 'first', coverage: { kind: 'full' } },
      arm_r: { depth: 'second_superficial', coverage: { kind: 'full' } },
    };
    const r = calculateScq('lund_browder', burns, ctx);
    expect(r.first).toBe(13);
    expect(r.second).toBe(3);
    expect(r.total).toBe(3);
  });

  it('suma 2.º superficial + 2.º profundo + 3.º', () => {
    const burns: BurnMap = {
      head: { depth: 'second_superficial', coverage: { kind: 'full' } },
      thigh_r: { depth: 'second_deep', coverage: { kind: 'fraction', value: 0.5 } },
      leg_l: { depth: 'third', coverage: { kind: 'full' } },
    };
    const r = calculateScq('lund_browder', burns, ctx);
    expect(r.secondSuperficial).toBe(7);
    expect(r.secondDeep).toBeCloseTo(4.75);
    expect(r.third).toBe(7);
    expect(r.total).toBeCloseTo(18.75);
  });

  it('pintar todo el cuerpo en Lund-Browder da 100 % en cada columna', () => {
    const burns: BurnMap = {};
    for (const z of LUND_BROWDER_ZONES) burns[z] = { depth: 'third', coverage: { kind: 'full' } };
    for (const column of [
      'infant',
      'child_1_4',
      'child_5_9',
      'child_10_14',
      'age_15',
      'adult',
    ] as const) {
      expect(calculateScq('lund_browder', burns, { age: 30, column }).total).toBeCloseTo(100);
    }
  });

  it('regla de los nueve: bloque completo y regla de la palma', () => {
    const burns: BurnMap = {
      thorax_anterior: { depth: 'second_deep', coverage: { kind: 'full' } },
      lower_limb_r: { depth: 'second_superficial', coverage: { kind: 'palms', count: 4 } },
    };
    const r = calculateScq('rule_of_nine', burns, ctx);
    expect(r.total).toBe(13);
  });

  it('regla de los nueve pediátrica usa los bloques de la edad', () => {
    const burns: BurnMap = { head_neck: { depth: 'third', coverage: { kind: 'full' } } };
    expect(calculateScq('rule_of_nine', burns, { age: 1, column: 'infant' }).total).toBe(18);
    expect(calculateScq('rule_of_nine', burns, { age: 30, column: 'adult' }).total).toBe(9);
  });
});
