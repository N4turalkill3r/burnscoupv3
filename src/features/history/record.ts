import {
  computeAssessmentView,
  isValidWeight,
  type AssessmentViewInput,
} from '@/features/burn-calculation/assessmentView';
import { isValidAge } from '@/features/burn-calculation/age';
import {
  CASE_FIELD_KEYS,
  RECORD_SCHEMA,
  type CaseFields,
  type CaseSummary,
  type PatientRecord,
} from './types';

/** Entrada del cálculo a partir de los campos de un caso. */
export function assessmentInputOf(fields: CaseFields): AssessmentViewInput {
  return {
    patientType: fields.patientType,
    age: fields.age,
    weightKg: fields.weightKg,
    burnType: fields.burnType,
    chemicalAgent: fields.chemicalAgent,
    modelOverride: fields.modelOverride,
    burnAt: fields.burnAt,
    arrivalAt: fields.arrivalAt,
    method: fields.method,
    burns: fields.burnsByMethod[fields.method],
    findings: fields.findings,
    doseConstantOverride: fields.doseConstantOverride,
  };
}

/** Un caso se puede guardar en el historial cuando tiene edad y peso válidos. */
export function isSaveable(fields: CaseFields): boolean {
  return isValidAge(fields.age) && isValidWeight(fields.weightKg);
}

/** Resultados clave del caso (null si todavía no se puede calcular). */
export function summarize(fields: CaseFields): CaseSummary | null {
  const { assessment } = computeAssessmentView(assessmentInputOf(fields));
  if (!assessment) return null;
  return {
    scqTotal: assessment.scq.total,
    scqThird: assessment.scq.third,
    volume24hMl: assessment.volume24hMl,
    thresholdExceeded: assessment.threshold.exceeded,
    derivationCount: assessment.derivation.length,
  };
}

/** Extrae sólo los campos del caso (copia superficial) de un objeto más grande, como el estado de la app. */
export function pickCaseFields(source: CaseFields): CaseFields {
  const out = {} as Record<string, unknown>;
  for (const key of CASE_FIELD_KEYS) out[key] = source[key];
  return out as unknown as CaseFields;
}

export function caseFieldsChanged(a: CaseFields, b: CaseFields): boolean {
  return CASE_FIELD_KEYS.some((key) => a[key] !== b[key]);
}

/**
 * Registro a guardar para un caso. Devuelve null si el caso no se puede guardar todavía
 * o si no cambió nada respecto al registro existente (así abrir un caso viejo no lo
 * "sube" en la lista).
 */
export function buildRecord(
  id: string,
  fields: CaseFields,
  existing: PatientRecord | null,
  now: Date,
): PatientRecord | null {
  if (!isSaveable(fields)) return null;
  const copy = pickCaseFields(fields);
  if (existing && JSON.stringify(existing.fields) === JSON.stringify(copy)) return null;
  const iso = now.toISOString();
  return {
    schema: RECORD_SCHEMA,
    id,
    createdAt: existing?.createdAt ?? iso,
    updatedAt: iso,
    fields: copy,
    summary: summarize(copy),
  };
}
