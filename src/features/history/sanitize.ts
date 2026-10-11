import { BURN_DEPTHS } from '@/data/depths';
import { FINDINGS, type Findings } from '@/data/findings';
import { ZONE_LABEL } from '@/data/zones';
import { BODY_MODELS } from '@/features/burn-calculation/age';
import type {
  BodyModelId,
  BurnMap,
  BurnType,
  ChemicalAgent,
  Coverage,
  PatientType,
  ScqMethod,
  ZoneId,
} from '@/shared/types/clinical';
import {
  emptyCaseFields,
  RECORD_SCHEMA,
  type CaseFields,
  type CaseSummary,
  type DiuresisEntry,
  type PatientRecord,
} from './types';

/**
 * Validación de datos que vienen de fuera (localStorage o un archivo importado).
 * Nada de lo que llega se asume correcto: cada campo se revisa y, si no es válido,
 * se usa el valor por defecto o se descarta.
 */

type Raw = Record<string, unknown>;

const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

function oneOf<T extends string>(x: unknown, allowed: readonly T[], fallback: T): T {
  return typeof x === 'string' && (allowed as readonly string[]).includes(x) ? (x as T) : fallback;
}

function numberOrNull(x: unknown, min: number, max: number): number | null {
  return typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max ? x : null;
}

const text = (x: unknown, maxLength: number): string =>
  typeof x === 'string' ? x.slice(0, maxLength) : '';

const PATIENT_TYPES: readonly PatientType[] = ['adult', 'pediatric'];
const BURN_TYPES: readonly BurnType[] = ['thermal', 'chemical', 'electric_high_voltage'];
const CHEMICAL_AGENTS: readonly ChemicalAgent[] = [
  'dry_powder',
  'acid',
  'alkali',
  'unknown_liquid',
];
const METHODS: readonly ScqMethod[] = ['lund_browder', 'rule_of_nine'];
const LIGHTS = ['red', 'green', 'yellow'] as const;
const DEPTH_IDS = BURN_DEPTHS.map((d) => d.id);
const ZONE_IDS = Object.keys(ZONE_LABEL) as ZoneId[];
const FINDING_IDS = FINDINGS.map((f) => f.id);

function sanitizeCoverage(x: unknown): Coverage | null {
  if (!isRecord(x)) return null;
  if (x.kind === 'full') return { kind: 'full' };
  if (x.kind === 'fraction') {
    const value = numberOrNull(x.value, 0.0001, 1);
    return value === null ? null : { kind: 'fraction', value };
  }
  if (x.kind === 'palms') {
    const count = numberOrNull(x.count, 1, 100);
    return count === null || !Number.isInteger(count) ? null : { kind: 'palms', count };
  }
  return null;
}

function sanitizeBurnMap(x: unknown): BurnMap {
  const out: BurnMap = {};
  if (!isRecord(x)) return out;
  for (const zone of ZONE_IDS) {
    const burn = x[zone];
    if (!isRecord(burn)) continue;
    const depth = oneOf(burn.depth, DEPTH_IDS, 'first');
    const valid = typeof burn.depth === 'string' && (DEPTH_IDS as string[]).includes(burn.depth);
    const coverage = sanitizeCoverage(burn.coverage);
    if (valid && coverage) out[zone] = { depth, coverage };
  }
  return out;
}

function sanitizeFindings(x: unknown): Findings {
  const out: Findings = {};
  if (!isRecord(x)) return out;
  for (const id of FINDING_IDS) {
    if (x[id] === true) out[id] = true;
  }
  return out;
}

function sanitizeDiuresisLog(x: unknown): DiuresisEntry[] {
  if (!Array.isArray(x)) return [];
  const out: DiuresisEntry[] = [];
  for (const item of x.slice(0, 500)) {
    if (!isRecord(item)) continue;
    const mlPerHour = numberOrNull(item.mlPerHour, 0, 100000);
    const mlPerKgH = numberOrNull(item.mlPerKgH, 0, 100000);
    if (
      typeof item.id !== 'string' ||
      typeof item.at !== 'string' ||
      mlPerHour === null ||
      mlPerKgH === null ||
      typeof item.light !== 'string' ||
      !(LIGHTS as readonly string[]).includes(item.light)
    ) {
      continue;
    }
    out.push({
      id: item.id.slice(0, 80),
      at: item.at.slice(0, 40),
      mlPerHour,
      mlPerKgH,
      light: item.light as DiuresisEntry['light'],
    });
  }
  return out;
}

/** Revisa los campos de un caso y rellena con valores por defecto lo que falte o sea inválido. */
export function sanitizeCaseFields(raw: unknown, fallbackArrival: string): CaseFields {
  const base = emptyCaseFields(fallbackArrival);
  if (!isRecord(raw)) return base;
  const maps = isRecord(raw.burnsByMethod) ? raw.burnsByMethod : {};

  const burnType = oneOf(raw.burnType, BURN_TYPES, base.burnType);
  const chemicalAgent =
    burnType === 'chemical' && typeof raw.chemicalAgent === 'string'
      ? oneOf(raw.chemicalAgent, CHEMICAL_AGENTS, 'unknown_liquid')
      : null;

  return {
    patientLabel: text(raw.patientLabel, 120),
    patientType: oneOf(raw.patientType, PATIENT_TYPES, base.patientType),
    age:
      typeof raw.age === 'number' && Number.isInteger(raw.age) && raw.age >= 0 && raw.age <= 120
        ? raw.age
        : null,
    weightKg: numberOrNull(raw.weightKg, 0.01, 1000),
    burnType,
    chemicalAgent,
    modelOverride:
      typeof raw.modelOverride === 'string' &&
      (BODY_MODELS as readonly string[]).includes(raw.modelOverride)
        ? (raw.modelOverride as BodyModelId)
        : null,
    burnAt: text(raw.burnAt, 32),
    arrivalAt: text(raw.arrivalAt, 32) || fallbackArrival,
    method: oneOf(raw.method, METHODS, base.method),
    burnsByMethod: {
      lund_browder: sanitizeBurnMap(maps.lund_browder),
      rule_of_nine: sanitizeBurnMap(maps.rule_of_nine),
    },
    findings: sanitizeFindings(raw.findings),
    doseConstantOverride: numberOrNull(raw.doseConstantOverride, 0.0001, 1000),
    actualDiuresisMlH: numberOrNull(raw.actualDiuresisMlH, 0, 100000),
    diuresisLog: sanitizeDiuresisLog(raw.diuresisLog),
  };
}

function sanitizeSummary(x: unknown): CaseSummary | null {
  if (!isRecord(x)) return null;
  const scqTotal = numberOrNull(x.scqTotal, 0, 100);
  const scqThird = numberOrNull(x.scqThird, 0, 100);
  const volume24hMl = numberOrNull(x.volume24hMl, 0, 1e9);
  const derivationCount = numberOrNull(x.derivationCount, 0, 100);
  if (scqTotal === null || scqThird === null || volume24hMl === null || derivationCount === null) {
    return null;
  }
  return {
    scqTotal,
    scqThird,
    volume24hMl,
    thresholdExceeded: x.thresholdExceeded === true,
    derivationCount,
  };
}

const isIsoDate = (x: unknown): x is string =>
  typeof x === 'string' && !Number.isNaN(Date.parse(x));

/** Convierte un dato externo en un registro válido, o null si no lo es. */
export function parsePatientRecord(raw: unknown): PatientRecord | null {
  if (!isRecord(raw)) return null;
  if (raw.schema !== RECORD_SCHEMA) return null;
  if (typeof raw.id !== 'string' || raw.id.length === 0 || raw.id.length > 80) return null;
  if (!isIsoDate(raw.createdAt) || !isIsoDate(raw.updatedAt)) return null;
  return {
    schema: RECORD_SCHEMA,
    id: raw.id,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    fields: sanitizeCaseFields(raw.fields, raw.updatedAt),
    summary: sanitizeSummary(raw.summary),
  };
}
