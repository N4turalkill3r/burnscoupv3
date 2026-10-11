import type { Findings } from '@/data/findings';
import type {
  BodyModelId,
  BurnMap,
  BurnType,
  ChemicalAgent,
  PatientType,
  ScqMethod,
} from '@/shared/types/clinical';
import { hoursBetween } from '@/shared/utils/time';
import { isValidAge, resolveBodyModel, type ModelResolution } from './age';
import { computeAssessment, type Assessment } from './assessment';

export const MAX_WEIGHT_KG = 300;

export function isValidWeight(weight: number | null | undefined): weight is number {
  return typeof weight === 'number' && weight > 0 && weight <= MAX_WEIGHT_KG;
}

/** Datos de entrada del caso (los mismos campos que guarda el estado de la app). */
export interface AssessmentViewInput {
  patientType: PatientType;
  age: number | null;
  weightKg: number | null;
  burnType: BurnType;
  chemicalAgent: ChemicalAgent | null;
  modelOverride: BodyModelId | null;
  burnAt: string;
  arrivalAt: string;
  method: ScqMethod;
  /** Marcas del método activo. */
  burns: BurnMap;
  findings: Findings;
  doseConstantOverride: number | null;
}

export interface AssessmentView {
  resolution: ModelResolution;
  /** Modelo en uso; null mientras el usuario no elija uno. */
  model: BodyModelId | null;
  /** Horas desde la quemadura hasta la llegada del equipo (null si falta alguna hora). */
  elapsedHours: number | null;
  /** Resultado completo; null si faltan datos del paciente o no hay modelo. */
  assessment: Assessment | null;
  /** Datos que faltan para poder calcular. */
  missing: string[];
}

/**
 * Une los datos del caso con los cálculos clínicos. Función pura: la usan tanto la
 * interfaz (useAssessment) como el guardado automático del historial.
 */
export function computeAssessmentView(input: AssessmentViewInput): AssessmentView {
  const { age, weightKg } = input;
  const resolution = resolveBodyModel({
    patientType: input.patientType,
    age,
    override: input.modelOverride,
  });
  const model = resolution.status === 'ok' ? resolution.model : null;
  const elapsedHours = hoursBetween(input.burnAt, input.arrivalAt);

  const missing: string[] = [];
  if (!isValidAge(age)) missing.push('la edad del paciente');
  if (!isValidWeight(weightKg)) missing.push('el peso del paciente');
  if (resolution.status !== 'ok') missing.push('el modelo corporal');

  let assessment: Assessment | null = null;
  if (missing.length === 0 && isValidAge(age) && isValidWeight(weightKg) && model) {
    assessment = computeAssessment({
      age,
      weightKg,
      burnType: input.burnType,
      chemicalAgent: input.chemicalAgent,
      model,
      method: input.method,
      burns: input.burns,
      findings: input.findings,
      doseConstantOverride: input.doseConstantOverride,
      elapsedHours,
    });
  }

  return { resolution, model, elapsedHours, assessment, missing };
}
