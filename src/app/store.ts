import { create } from 'zustand';
import { DEFAULT_BRUSH, paintZone, type Brush } from '@/features/body-model/painting';
import type { FindingId } from '@/data/findings';
import { emptyCaseFields, type CaseFields, type DiuresisEntry } from '@/features/history/types';
import { newId } from '@/shared/utils/id';
import { nowLocalInputValue } from '@/shared/utils/time';
import type {
  BodyModelId,
  BurnType,
  ChemicalAgent,
  PatientType,
  ScqMethod,
  ZoneId,
} from '@/shared/types/clinical';

/** Pasos del flujo, en orden. */
export const STEPS = [
  { id: 'patient', label: 'Paciente' },
  { id: 'timing', label: 'Horas' },
  { id: 'burns', label: 'Quemaduras' },
  { id: 'findings', label: 'Hallazgos' },
  { id: 'results', label: 'Resultados' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

/** Pantalla visible: el flujo de captura o el historial de pacientes. */
export type ViewId = 'wizard' | 'history';

/**
 * Estado de la aplicación. Los campos de `CaseFields` (paciente, horas, quemaduras,
 * hallazgos, dosis, diuresis) se guardan en el historial; el resto es sólo de pantalla.
 *
 * Nota: `patientType`, `age`... están al mismo nivel que `step` para que los selectores
 * de cada componente sean simples.
 */
export interface AppState extends CaseFields {
  /** Identificador del caso abierto (clave en el historial). */
  caseId: string;
  view: ViewId;
  step: StepId;
  brush: Brush;
}

export interface AppActions {
  goTo: (step: StepId) => void;
  setView: (view: ViewId) => void;
  setPatientLabel: (label: string) => void;
  setPatientType: (type: PatientType) => void;
  setAge: (age: number | null) => void;
  setWeightKg: (weight: number | null) => void;
  setBurnType: (type: BurnType) => void;
  setChemicalAgent: (agent: ChemicalAgent | null) => void;
  setModelOverride: (model: BodyModelId | null) => void;
  setBurnAt: (value: string) => void;
  setArrivalAt: (value: string) => void;
  setMethod: (method: ScqMethod) => void;
  setBrush: (brush: Brush) => void;
  paint: (zone: ZoneId) => void;
  clearZone: (zone: ZoneId) => void;
  clearBurns: () => void;
  setFinding: (id: FindingId, value: boolean) => void;
  setDoseConstantOverride: (value: number | null) => void;
  setActualDiuresis: (value: number | null) => void;
  addDiuresisEntry: (entry: Omit<DiuresisEntry, 'id'>) => void;
  removeDiuresisEntry: (id: string) => void;
  /** Abre un caso del historial. */
  loadCase: (id: string, fields: CaseFields) => void;
  /** Empieza un caso nuevo (nuevo identificador). */
  reset: () => void;
}

const initialState = (): AppState => ({
  ...emptyCaseFields(nowLocalInputValue()),
  caseId: newId(),
  view: 'wizard',
  step: 'patient',
  brush: DEFAULT_BRUSH,
});

/** Quita lo que ya no aplica al cargar un caso (la brocha no es parte del caso). */
const loadedState = (id: string, fields: CaseFields): Partial<AppState> => ({
  ...fields,
  caseId: id,
  view: 'wizard',
  step: 'patient',
  brush: DEFAULT_BRUSH,
});

export const useAppStore = create<AppState & AppActions>()((set) => ({
  ...initialState(),

  goTo: (step) => set({ step, view: 'wizard' }),
  setView: (view) => set({ view }),
  setPatientLabel: (patientLabel) => set({ patientLabel }),

  setPatientType: (patientType) => set({ patientType, modelOverride: null }),
  setAge: (age) => set({ age }),
  setWeightKg: (weightKg) => set({ weightKg }),
  setBurnType: (burnType) =>
    set((s) => ({
      burnType,
      chemicalAgent: burnType === 'chemical' ? s.chemicalAgent : null,
      // La constante propuesta cambia con el tipo de quemadura: se vuelve a la del protocolo.
      doseConstantOverride: null,
    })),
  setChemicalAgent: (chemicalAgent) => set({ chemicalAgent }),
  setModelOverride: (modelOverride) => set({ modelOverride }),

  setBurnAt: (burnAt) => set({ burnAt }),
  setArrivalAt: (arrivalAt) => set({ arrivalAt }),

  setMethod: (method) =>
    set((s) => ({
      method,
      // Las palmas sólo existen en la regla de los nueve.
      brush:
        method === 'lund_browder' && s.brush.coverage.kind === 'palms'
          ? { ...s.brush, coverage: { kind: 'full' } }
          : s.brush,
    })),
  setBrush: (brush) => set({ brush }),
  paint: (zone) =>
    set((s) => {
      const current = s.burnsByMethod[s.method];
      const next = paintZone(current, zone, s.brush);
      if (next === current) return s;
      return { burnsByMethod: { ...s.burnsByMethod, [s.method]: next } };
    }),
  clearZone: (zone) =>
    set((s) => {
      const current = s.burnsByMethod[s.method];
      const next = paintZone(current, zone, { depth: 'erase', coverage: { kind: 'full' } });
      if (next === current) return s;
      return { burnsByMethod: { ...s.burnsByMethod, [s.method]: next } };
    }),
  clearBurns: () => set((s) => ({ burnsByMethod: { ...s.burnsByMethod, [s.method]: {} } })),

  setFinding: (id, value) => set((s) => ({ findings: { ...s.findings, [id]: value } })),
  setDoseConstantOverride: (doseConstantOverride) => set({ doseConstantOverride }),
  setActualDiuresis: (actualDiuresisMlH) => set({ actualDiuresisMlH }),

  addDiuresisEntry: (entry) =>
    set((s) => ({ diuresisLog: [...s.diuresisLog, { ...entry, id: newId() }] })),
  removeDiuresisEntry: (id) =>
    set((s) => ({ diuresisLog: s.diuresisLog.filter((e) => e.id !== id) })),

  loadCase: (id, fields) => set(loadedState(id, fields)),
  reset: () => set(initialState()),
}));
