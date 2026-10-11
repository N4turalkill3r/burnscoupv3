import { describe, expect, it } from 'vitest';
import { hollidaySegarMlPerHour, maintenancePlan } from '@/features/burn-calculation/maintenance';

describe('Holliday-Segar 4-2-1 (ejemplos del PDF)', () => {
  it.each([
    [8, 32],
    [10, 40],
    [15, 50],
    [25, 65],
    [35, 75],
  ])('%i kg → %i ml/h', (kg, expected) => {
    expect(hollidaySegarMlPerHour(kg)).toBe(expected);
  });

  it('atajo del PDF: más de 20 kg → peso + 40', () => {
    for (const kg of [21, 30, 45, 60]) {
      expect(hollidaySegarMlPerHour(kg)).toBe(kg + 40);
    }
  });
});

describe('mantenimiento por edad', () => {
  it('aplica a pediátricos; a los 14 años es criterio especial fuera de protocolo', () => {
    expect(maintenancePlan(8, 25)).toEqual({
      applies: true,
      mlPerHour: 65,
      specialCriterion: false,
    });
    expect(maintenancePlan(13, 45)).toMatchObject({ applies: true, specialCriterion: false });
    expect(maintenancePlan(14, 50)).toEqual({
      applies: true,
      mlPerHour: 90,
      specialCriterion: true,
    });
  });
  it('no aplica a adultos (≥ 15 años)', () => {
    expect(maintenancePlan(15, 60)).toEqual({
      applies: false,
      mlPerHour: 0,
      specialCriterion: false,
    });
    expect(maintenancePlan(40, 80).applies).toBe(false);
  });
});
