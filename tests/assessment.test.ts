import { describe, expect, it } from 'vitest';
import { computeAssessment, type AssessmentInput } from '@/features/burn-calculation/assessment';

const base: AssessmentInput = {
  age: 35,
  weightKg: 80,
  burnType: 'thermal',
  chemicalAgent: null,
  model: 'adult',
  method: 'rule_of_nine',
  burns: {},
  findings: {},
  doseConstantOverride: null,
  elapsedHours: 2,
};

describe('evaluación completa', () => {
  it('adulto con 36 % SCQ: volumen, umbral y reparto', () => {
    const a = computeAssessment({
      ...base,
      burns: {
        thorax_anterior: { depth: 'second_deep', coverage: { kind: 'full' } },
        abdomen_anterior: { depth: 'second_deep', coverage: { kind: 'full' } },
        lower_limb_r: { depth: 'third', coverage: { kind: 'full' } },
      },
    });
    expect(a.scq.total).toBe(36);
    expect(a.threshold.exceeded).toBe(true);
    expect(a.constant).toMatchObject({ value: 2, isDefault: true });
    expect(a.volume24hMl).toBe(2 * 80 * 36);
    expect(a.schedule?.blocks[0]?.durationHours).toBe(6);
    expect(a.maintenance.applies).toBe(false);
    expect(a.derivation.map((d) => d.id)).toEqual(expect.arrayContaining([1, 3]));
  });

  it('constante escrita por el usuario reemplaza la propuesta', () => {
    const a = computeAssessment({
      ...base,
      doseConstantOverride: 3,
      burns: { head_neck: { depth: 'third', coverage: { kind: 'full' } } },
    });
    expect(a.constant).toMatchObject({ value: 3, isDefault: false, defaultValue: 2 });
    expect(a.volume24hMl).toBe(3 * 80 * 9);
  });

  it('niño de 8 años, 25 kg: constante 3 y mantenimiento 65 ml/h', () => {
    const a = computeAssessment({
      ...base,
      age: 8,
      weightKg: 25,
      model: 'child_5_9',
      method: 'lund_browder',
      burns: {
        trunk_anterior: { depth: 'second_superficial', coverage: { kind: 'full' } },
      },
    });
    expect(a.isPediatric).toBe(true);
    expect(a.constant.value).toBe(3);
    expect(a.volume24hMl).toBe(3 * 25 * 13);
    expect(a.maintenance).toEqual({ applies: true, mlPerHour: 65, specialCriterion: false });
    expect(a.diuresisTarget.targetMlPerKgH).toBe(1);
    expect(a.threshold).toMatchObject({ percent: 10, exceeded: true });
  });

  it('sin hora de llegada no calcula el reparto', () => {
    expect(computeAssessment({ ...base, elapsedHours: null }).schedule).toBeNull();
  });

  it('detecta áreas especiales pintadas y las incluye en la derivación', () => {
    const a = computeAssessment({
      ...base,
      method: 'lund_browder',
      burns: { hand_r: { depth: 'second_superficial', coverage: { kind: 'full' } } },
    });
    expect(a.autoSpecialAreas.hands).toBe(true);
    expect(a.derivation.some((d) => d.id === 2)).toBe(true);
  });

  it('un 1.er grado en la mano no activa el criterio de áreas especiales', () => {
    const a = computeAssessment({
      ...base,
      method: 'lund_browder',
      burns: { hand_r: { depth: 'first', coverage: { kind: 'full' } } },
    });
    expect(a.autoSpecialAreas.hands).toBe(false);
    expect(a.scq.total).toBe(0);
  });
});

describe('recomendaciones', () => {
  const ids = (a: ReturnType<typeof computeAssessment>) => a.recommendations.map((r) => r.id);

  it('siempre incluye las medidas generales y las prohibiciones', () => {
    const a = computeAssessment(base);
    expect(ids(a)).toEqual(
      expect.arrayContaining([
        'breathing-oxygen',
        'exposure-prohibitions',
        'fluids-titration',
        'monitoring-record',
      ]),
    );
  });

  it('estridor activa la intubación temprana (crítica y primera)', () => {
    const a = computeAssessment({ ...base, findings: { stridor_dysphonia: true } });
    expect(ids(a)).toContain('airway-intubation');
    expect(a.recommendations[0]?.severity).toBe('critical');
  });

  it('química con álcali: irrigación mínima de 60 minutos', () => {
    const a = computeAssessment({ ...base, burnType: 'chemical', chemicalAgent: 'alkali' });
    const rec = a.recommendations.find((r) => r.id === 'chemical-general');
    expect(rec?.details.join(' ')).toMatch(/60 minutos/);
  });

  it('eléctrica de alto voltaje: EKG continuo y derivación', () => {
    const a = computeAssessment({ ...base, burnType: 'electric_high_voltage' });
    expect(ids(a)).toContain('electrical-ekg');
    expect(a.derivation.some((d) => d.id === 4)).toBe(true);
    expect(a.constant.value).toBe(4);
  });

  it('pediatría: control metabólico solo en niños', () => {
    expect(ids(computeAssessment(base))).not.toContain('pediatric-metabolic');
    const kid = computeAssessment({ ...base, age: 6, weightKg: 20, model: 'child_5_9' });
    expect(ids(kid)).toContain('pediatric-metabolic');
  });

  it('con SCQ bajo el umbral no activa la reanimación masiva', () => {
    const a = computeAssessment({
      ...base,
      burns: { head_neck: { depth: 'second_deep', coverage: { kind: 'full' } } },
    });
    expect(ids(a)).toContain('fluids-below-threshold');
    expect(ids(a)).not.toContain('fluids-massive');
  });
});
