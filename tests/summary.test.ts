import { describe, expect, it } from 'vitest';
import { computeAssessment } from '@/features/burn-calculation/assessment';
import { buildSummaryText, DISCLAIMER } from '@/features/results/summary';

const adult = computeAssessment({
  age: 30,
  weightKg: 70,
  burnType: 'thermal',
  chemicalAgent: null,
  model: 'adult',
  method: 'rule_of_nine',
  burns: {
    thorax_anterior: { depth: 'second_deep', coverage: { kind: 'full' } },
    abdomen_anterior: { depth: 'third', coverage: { kind: 'full' } },
  },
  findings: {},
  doseConstantOverride: null,
  elapsedHours: 2,
});

describe('buildSummaryText', () => {
  const text = buildSummaryText({
    age: 30,
    weightKg: 70,
    burnTypeLabel: 'Térmica',
    modelLabel: 'Adulto',
    methodLabel: 'Regla de los nueve',
    assessment: adult,
  });

  it('incluye SCQ, volumen y velocidades con los números del cálculo', () => {
    // 18 % SCQ × 70 kg × 2 ml = 2520 ml; llega a las 2 h → primer 50 % en 6 h = 210 ml/h
    expect(text).toContain('18 %');
    expect(text).toContain('2520 ml');
    expect(text).toContain('210 ml/h');
  });

  it('termina con la advertencia de herramienta de apoyo', () => {
    expect(text.endsWith(DISCLAIMER)).toBe(true);
  });

  it('indica la constante del protocolo cuando no se editó', () => {
    expect(text).toContain('del protocolo');
  });
});
