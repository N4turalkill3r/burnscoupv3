import { describe, expect, it } from 'vitest';
import { assessDiuresis, diuresisTarget } from '@/features/diuresis/diuresis';

const adult = { age: 35, weightKg: 70, burnType: 'thermal' as const, pigmentedUrine: false };

describe('meta de diuresis', () => {
  it('adulto: 0,5 ml/kg/h (≈ 35 ml/h para 70 kg)', () => {
    const t = diuresisTarget(adult);
    expect(t.targetMlPerKgH).toBe(0.5);
    expect(t.minMlPerHour).toBe(35);
    expect(t.maxMlPerHour).toBeCloseTo(52.5);
  });
  it('el peso manda: < 30 kg → 1,0 ml/kg/h; adolescente ≥ 30 kg → 0,5', () => {
    expect(diuresisTarget({ ...adult, age: 5, weightKg: 18 }).targetMlPerKgH).toBe(1);
    expect(diuresisTarget({ ...adult, age: 13, weightKg: 45 }).targetMlPerKgH).toBe(0.5);
    expect(diuresisTarget({ ...adult, age: 29, weightKg: 25 }).targetMlPerKgH).toBe(1);
  });
  it('eléctrica con orina pigmentada: adulto 1,0–1,5; niño 1,5–2,0', () => {
    const a = diuresisTarget({ ...adult, burnType: 'electric_high_voltage', pigmentedUrine: true });
    expect([a.minMlPerKgH, a.maxMlPerKgH]).toEqual([1.0, 1.5]);
    const c = diuresisTarget({
      age: 8,
      weightKg: 25,
      burnType: 'electric_high_voltage',
      pigmentedUrine: true,
    });
    expect([c.minMlPerKgH, c.maxMlPerKgH]).toEqual([1.5, 2.0]);
  });
  it('orina pigmentada solo cambia la meta en eléctrica', () => {
    expect(diuresisTarget({ ...adult, pigmentedUrine: true }).mode).toBe('standard');
  });
});

describe('semáforo de diuresis', () => {
  const target = diuresisTarget(adult); // 35–52,5 ml/h
  const run = (actual: number, rate: number | null = 500) =>
    assessDiuresis({ actualMlPerHour: actual, weightKg: 70, target, currentRateMlPerHour: rate });

  it('rojo: por debajo de la meta, con +20–25 % de infusión', () => {
    const r = run(20);
    expect(r.light).toBe('red');
    expect(r.title).toBe('La diuresis es muy baja');
    expect(r.suggestedRateRange).toEqual({ min: 600, max: 625 });
  });
  it('verde: entre la meta y 1,5 veces la meta (incluye los límites)', () => {
    expect(run(35).light).toBe('green');
    expect(run(45).light).toBe('green');
    expect(run(52.5).light).toBe('green');
    expect(run(45).title).toBe('La diuresis es correcta, vas por buen camino');
  });
  it('amarillo: sobre-hidratación cuando supera lo esperado', () => {
    const r = run(80);
    expect(r.light).toBe('yellow');
    expect(r.title).toBe('Estás sobrehidratando al paciente');
    expect(r.suggestedRateRange).toBeNull();
  });
  it('rojo sin velocidad actual: no sugiere rango', () => {
    expect(run(10, null).suggestedRateRange).toBeNull();
  });
});
