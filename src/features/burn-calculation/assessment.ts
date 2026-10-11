import type { Findings } from '@/data/findings';
import { diuresisTarget, type DiuresisTarget } from '@/features/diuresis/diuresis';
import {
  evaluateDerivationCriteria,
  type DerivationCriterion,
} from '@/features/recommendations/derivation';
import { buildRecommendations } from '@/features/recommendations/engine';
import type { Recommendation } from '@/data/recommendationRules';
import type {
  BodyModelId,
  BurnMap,
  BurnType,
  ChemicalAgent,
  LundBrowderColumn,
  ScqMethod,
} from '@/shared/types/clinical';
import { lundBrowderColumnForModel, patientTypeForAge, proportionAgeForModel } from './age';
import { maintenancePlan, type MaintenancePlan } from './maintenance';
import {
  buildInfusionSchedule,
  defaultParklandConstant,
  initialRateBandLabel,
  initialRateMlPerHour,
  isConstantInProtocolRange,
  totalVolume24h,
  type InfusionSchedule,
} from './parkland';
import { calculateScq, type ScqResult } from './scq';
import { detectSpecialAreas, type AutoSpecialAreas } from './specialAreas';
import { exceedsScqThreshold, scqThresholdForAge } from './thresholds';

export interface AssessmentInput {
  age: number;
  weightKg: number;
  burnType: BurnType;
  chemicalAgent: ChemicalAgent | null;
  /** Modelo corporal en uso (por edad o elegido por el usuario). */
  model: BodyModelId;
  method: ScqMethod;
  burns: BurnMap;
  findings: Findings;
  /** Constante escrita por el usuario; null = usar la propuesta por el protocolo. */
  doseConstantOverride: number | null;
  /** Horas desde la quemadura hasta la llegada del equipo; null si aún no se ingresó. */
  elapsedHours: number | null;
}

export interface Assessment {
  isPediatric: boolean;
  lundBrowderColumn: LundBrowderColumn;
  scq: ScqResult;
  threshold: { percent: number; label: string; exceeded: boolean };
  constant: { value: number; isDefault: boolean; defaultValue: number; inProtocolRange: boolean };
  volume24hMl: number;
  schedule: InfusionSchedule | null;
  maintenance: MaintenancePlan;
  preCalc: { mlPerHour: number; label: string };
  pigmentedUrine: boolean;
  diuresisTarget: DiuresisTarget;
  autoSpecialAreas: AutoSpecialAreas;
  derivation: DerivationCriterion[];
  recommendations: Recommendation[];
}

/** Orquesta todos los cálculos y recomendaciones. Función pura (sin UI). */
export function computeAssessment(input: AssessmentInput): Assessment {
  const isPediatric = patientTypeForAge(input.age) === 'pediatric';
  const column = lundBrowderColumnForModel(input.model, input.age);
  const proportionAge = proportionAgeForModel(input.model, input.age);

  const scq = calculateScq(input.method, input.burns, { age: proportionAge, column });

  const band = scqThresholdForAge(input.age);
  const exceeded = exceedsScqThreshold(scq.total, input.age);

  const defaultValue = defaultParklandConstant({ burnType: input.burnType, age: input.age });
  const constantValue = input.doseConstantOverride ?? defaultValue;

  const volume24hMl = totalVolume24h({
    constant: constantValue,
    weightKg: input.weightKg,
    scqPercent: scq.total,
  });

  const schedule =
    input.elapsedHours === null ? null : buildInfusionSchedule(volume24hMl, input.elapsedHours);

  const pigmentedUrine = Boolean(input.findings.pigmented_urine);
  const autoSpecialAreas = detectSpecialAreas(input.method, input.burns);

  const derivation = evaluateDerivationCriteria({
    burnType: input.burnType,
    isPediatric,
    secondDegreePercent: scq.second,
    hasThirdDegree: scq.third > 0,
    findings: input.findings,
    autoSpecialAreas,
  });

  const recommendations = buildRecommendations({
    age: input.age,
    weightKg: input.weightKg,
    isPediatric,
    burnType: input.burnType,
    chemicalAgent: input.chemicalAgent,
    findings: input.findings,
    scqTotal: scq.total,
    scqThresholdPercent: band.thresholdPercent,
    scqThresholdLabel: band.label,
    thresholdExceeded: exceeded,
    derivation,
  });

  return {
    isPediatric,
    lundBrowderColumn: column,
    scq,
    threshold: { percent: band.thresholdPercent, label: band.label, exceeded },
    constant: {
      value: constantValue,
      isDefault: input.doseConstantOverride === null,
      defaultValue,
      inProtocolRange: isConstantInProtocolRange(constantValue),
    },
    volume24hMl,
    schedule,
    maintenance: maintenancePlan(input.age, input.weightKg),
    preCalc: { mlPerHour: initialRateMlPerHour(input.age), label: initialRateBandLabel(input.age) },
    pigmentedUrine,
    diuresisTarget: diuresisTarget({
      age: input.age,
      weightKg: input.weightKg,
      burnType: input.burnType,
      pigmentedUrine,
    }),
    autoSpecialAreas,
    derivation,
    recommendations,
  };
}
