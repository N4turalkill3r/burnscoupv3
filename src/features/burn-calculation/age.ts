import { PEDIATRIC_MAX_AGE } from '@/data/fluidProtocol';
import type { BodyModelId, LundBrowderColumn, PatientType } from '@/shared/types/clinical';

/** Todas las edades se manejan en años cumplidos (entero ≥ 0). */

export function isValidAge(age: number | null | undefined): age is number {
  return typeof age === 'number' && Number.isInteger(age) && age >= 0 && age <= 120;
}

/** Pediátrico hasta los 14 años; adulto desde los 15. */
export function patientTypeForAge(age: number): PatientType {
  return age <= PEDIATRIC_MAX_AGE ? 'pediatric' : 'adult';
}

/** Modelo 3D que corresponde a la edad. */
export function bodyModelForAge(age: number): BodyModelId {
  if (age <= 1) return 'infant';
  if (age <= 4) return 'child_1_4';
  if (age <= 9) return 'child_5_9';
  if (age <= 14) return 'child_10_14';
  return 'adult';
}

/** Columna de Lund-Browder que corresponde a la edad (15 años tiene su propia columna). */
export function lundBrowderColumnForAge(age: number): LundBrowderColumn {
  if (age <= 1) return 'infant';
  if (age <= 4) return 'child_1_4';
  if (age <= 9) return 'child_5_9';
  if (age <= 14) return 'child_10_14';
  if (age === 15) return 'age_15';
  return 'adult';
}

/** Columna de Lund-Browder asociada a un modelo (cuando el usuario elige el modelo manualmente). */
export function lundBrowderColumnForModel(
  model: BodyModelId,
  age: number | null,
): LundBrowderColumn {
  if (model === 'adult') return age === 15 ? 'age_15' : 'adult';
  return model;
}

export const BODY_MODEL_LABEL: Record<BodyModelId, string> = {
  infant: 'Lactante (nac.–1 año)',
  child_1_4: 'Niño 1–4 años',
  child_5_9: 'Niño 5–9 años',
  child_10_14: 'Niño/adolescente 10–14 años',
  adult: 'Adulto (≥ 15 años)',
};

export const BODY_MODELS: readonly BodyModelId[] = [
  'infant',
  'child_1_4',
  'child_5_9',
  'child_10_14',
  'adult',
];

export type ModelResolution =
  | { status: 'ok'; model: BodyModelId; source: 'age' | 'override' }
  | { status: 'needs-selection'; reason: string; options: readonly BodyModelId[] };

/**
 * Decide qué modelo usar. Si el tipo de paciente no existe dentro de un modelo de cálculo
 * (edad ausente o incompatible con el tipo), NO se asume nada: se pide al usuario que elija
 * el modelo de su preferencia.
 */
export function resolveBodyModel(input: {
  patientType: PatientType;
  age: number | null;
  override: BodyModelId | null;
}): ModelResolution {
  if (input.override) return { status: 'ok', model: input.override, source: 'override' };
  if (!isValidAge(input.age)) {
    return {
      status: 'needs-selection',
      reason: 'No hay una edad válida para asignar un modelo. Cambia al modelo de tu preferencia.',
      options: BODY_MODELS,
    };
  }
  if (patientTypeForAge(input.age) !== input.patientType) {
    const expected =
      input.patientType === 'adult' ? 'adulto (≥ 15 años)' : 'pediátrico (≤ 14 años)';
    return {
      status: 'needs-selection',
      reason: `La edad ingresada (${input.age} años) no existe dentro del modelo de paciente ${expected}. Cambia al modelo de tu preferencia.`,
      options: BODY_MODELS,
    };
  }
  return { status: 'ok', model: bodyModelForAge(input.age), source: 'age' };
}

/** Edad representativa de cada modelo (para la regla de los nueve cuando el usuario elige el modelo a mano). */
const MODEL_REFERENCE_AGE: Record<BodyModelId, number> = {
  infant: 1,
  child_1_4: 3,
  child_5_9: 7,
  child_10_14: 12,
  adult: 30,
};

/**
 * Edad con la que se calculan las proporciones del modelo: la edad real si el modelo
 * corresponde a ella; si el usuario eligió otro modelo, la edad representativa de ese modelo.
 */
export function proportionAgeForModel(model: BodyModelId, age: number | null): number {
  if (isValidAge(age) && bodyModelForAge(age) === model) return age;
  return MODEL_REFERENCE_AGE[model];
}
