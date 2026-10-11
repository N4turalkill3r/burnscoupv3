import { describe, expect, it } from 'vitest';
import {
  bodyModelForAge,
  lundBrowderColumnForAge,
  lundBrowderColumnForModel,
  patientTypeForAge,
  proportionAgeForModel,
  resolveBodyModel,
} from '@/features/burn-calculation/age';

describe('clasificación por edad', () => {
  it('14 años es pediátrico y 15 es adulto', () => {
    expect(patientTypeForAge(14)).toBe('pediatric');
    expect(patientTypeForAge(15)).toBe('adult');
    expect(patientTypeForAge(0)).toBe('pediatric');
  });

  it.each([
    [0, 'infant'],
    [1, 'infant'],
    [2, 'child_1_4'],
    [4, 'child_1_4'],
    [5, 'child_5_9'],
    [9, 'child_5_9'],
    [10, 'child_10_14'],
    [14, 'child_10_14'],
    [15, 'adult'],
    [80, 'adult'],
  ] as const)('modelo 3D de %i años = %s', (age, model) => {
    expect(bodyModelForAge(age)).toBe(model);
  });

  it('columna de Lund-Browder: 1 año exacto → Nac.–1; 15 años → columna 15; ≥ 16 → adulto', () => {
    expect(lundBrowderColumnForAge(1)).toBe('infant');
    expect(lundBrowderColumnForAge(2)).toBe('child_1_4');
    expect(lundBrowderColumnForAge(14)).toBe('child_10_14');
    expect(lundBrowderColumnForAge(15)).toBe('age_15');
    expect(lundBrowderColumnForAge(16)).toBe('adult');
  });

  it('el modelo adulto usa la columna "15 años" solo a los 15 años', () => {
    expect(lundBrowderColumnForModel('adult', 15)).toBe('age_15');
    expect(lundBrowderColumnForModel('adult', 40)).toBe('adult');
    expect(lundBrowderColumnForModel('child_5_9', 40)).toBe('child_5_9');
  });

  it('edad de proporciones: la real si coincide con el modelo; la representativa si no', () => {
    expect(proportionAgeForModel('child_5_9', 6)).toBe(6);
    expect(proportionAgeForModel('infant', 40)).toBe(1);
  });
});

describe('resolución del modelo (paciente sin modelo de cálculo)', () => {
  it('asigna el modelo por edad cuando coincide con el tipo de paciente', () => {
    expect(resolveBodyModel({ patientType: 'pediatric', age: 7, override: null })).toEqual({
      status: 'ok',
      model: 'child_5_9',
      source: 'age',
    });
  });

  it('pide elegir modelo si la edad no corresponde al tipo de paciente', () => {
    const r = resolveBodyModel({ patientType: 'adult', age: 8, override: null });
    expect(r.status).toBe('needs-selection');
  });

  it('pide elegir modelo si no hay edad válida', () => {
    expect(resolveBodyModel({ patientType: 'pediatric', age: null, override: null }).status).toBe(
      'needs-selection',
    );
    expect(resolveBodyModel({ patientType: 'adult', age: 2.5, override: null }).status).toBe(
      'needs-selection',
    );
  });

  it('respeta el modelo elegido por el usuario', () => {
    expect(resolveBodyModel({ patientType: 'adult', age: 8, override: 'child_5_9' })).toEqual({
      status: 'ok',
      model: 'child_5_9',
      source: 'override',
    });
  });
});
