import type { Findings } from '@/data/findings';
import type {
  BodyModelId,
  BurnMap,
  BurnType,
  ChemicalAgent,
  PatientType,
  ScqMethod,
} from '@/shared/types/clinical';

/** Lectura de diuresis registrada durante la atención. */
export interface DiuresisEntry {
  id: string;
  /** Momento del registro (ISO 8601). */
  at: string;
  mlPerHour: number;
  mlPerKgH: number;
  light: 'red' | 'green' | 'yellow';
}

/** Todo lo que define un caso clínico y se guarda en el historial. */
export interface CaseFields {
  /** Nombre o identificador del paciente (opcional). */
  patientLabel: string;
  patientType: PatientType;
  age: number | null;
  weightKg: number | null;
  burnType: BurnType;
  chemicalAgent: ChemicalAgent | null;
  modelOverride: BodyModelId | null;
  burnAt: string;
  arrivalAt: string;
  method: ScqMethod;
  burnsByMethod: Record<ScqMethod, BurnMap>;
  findings: Findings;
  doseConstantOverride: number | null;
  actualDiuresisMlH: number | null;
  diuresisLog: DiuresisEntry[];
}

export const CASE_FIELD_KEYS: readonly (keyof CaseFields)[] = [
  'patientLabel',
  'patientType',
  'age',
  'weightKg',
  'burnType',
  'chemicalAgent',
  'modelOverride',
  'burnAt',
  'arrivalAt',
  'method',
  'burnsByMethod',
  'findings',
  'doseConstantOverride',
  'actualDiuresisMlH',
  'diuresisLog',
];

/** Resultados clave de un caso, para mostrarlos en la lista sin recalcular. */
export interface CaseSummary {
  scqTotal: number;
  scqThird: number;
  volume24hMl: number;
  thresholdExceeded: boolean;
  derivationCount: number;
}

export const RECORD_SCHEMA = 1;

/** Un paciente guardado en el historial. */
export interface PatientRecord {
  schema: typeof RECORD_SCHEMA;
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: CaseFields;
  summary: CaseSummary | null;
}

export function emptyCaseFields(arrivalAt: string): CaseFields {
  return {
    patientLabel: '',
    patientType: 'adult',
    age: null,
    weightKg: null,
    burnType: 'thermal',
    chemicalAgent: null,
    modelOverride: null,
    burnAt: '',
    arrivalAt,
    method: 'lund_browder',
    burnsByMethod: { lund_browder: {}, rule_of_nine: {} },
    findings: {},
    doseConstantOverride: null,
    actualDiuresisMlH: null,
    diuresisLog: [],
  };
}
