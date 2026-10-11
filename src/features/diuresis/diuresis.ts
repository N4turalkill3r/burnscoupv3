import { DIURESIS, PEDIATRIC_MAX_AGE } from '@/data/fluidProtocol';
import type { BurnType } from '@/shared/types/clinical';

export interface DiuresisTarget {
  /** Límite inferior de la meta (ml/kg/h). */
  minMlPerKgH: number;
  /** Límite superior del rango "correcto" (ml/kg/h). */
  maxMlPerKgH: number;
  /** Meta puntual del protocolo (ml/kg/h). */
  targetMlPerKgH: number;
  /** Texto de la meta, p. ej. "0,5 ml/kg/h". */
  description: string;
  mode: 'standard' | 'myoglobinuria';
  /** Meta en ml/h para el peso del paciente. */
  minMlPerHour: number;
  maxMlPerHour: number;
}

const fmt = (n: number) => String(n).replace('.', ',');

/**
 * Meta de diuresis horaria.
 * - Térmica/química (y eléctrica sin orina pigmentada): el peso decide: < 30 kg → 1,0 ml/kg/h;
 *   si no → 0,5 ml/kg/h. Verde hasta 1,5 veces la meta (decisión del usuario).
 * - Eléctrica con orina pigmentada: adultos 1,0–1,5 ml/kg/h; niños 1,5–2,0 ml/kg/h.
 */
export function diuresisTarget(input: {
  age: number;
  weightKg: number;
  burnType: BurnType;
  pigmentedUrine: boolean;
}): DiuresisTarget {
  const isChild = input.age <= PEDIATRIC_MAX_AGE;

  if (input.burnType === 'electric_high_voltage' && input.pigmentedUrine) {
    const range = isChild ? DIURESIS.myoglobinuriaChild : DIURESIS.myoglobinuriaAdult;
    return {
      minMlPerKgH: range.min,
      maxMlPerKgH: range.max,
      targetMlPerKgH: range.min,
      description: `${fmt(range.min)} a ${fmt(range.max)} ml/kg/h (orina pigmentada, hasta que aclare)`,
      mode: 'myoglobinuria',
      minMlPerHour: range.min * input.weightKg,
      maxMlPerHour: range.max * input.weightKg,
    };
  }

  const target =
    input.weightKg < DIURESIS.pediatricWeightLimitKg
      ? DIURESIS.pediatricTarget
      : DIURESIS.adultTarget;
  const max = target * DIURESIS.greenUpperRatio;
  return {
    minMlPerKgH: target,
    maxMlPerKgH: max,
    targetMlPerKgH: target,
    description: `${fmt(target)} ml/kg/h`,
    mode: 'standard',
    minMlPerHour: target * input.weightKg,
    maxMlPerHour: max * input.weightKg,
  };
}

export type DiuresisStatus = 'low' | 'adequate' | 'high';
export type TrafficLight = 'red' | 'green' | 'yellow';

export interface DiuresisAssessment {
  status: DiuresisStatus;
  light: TrafficLight;
  title: string;
  message: string;
  actualMlPerKgH: number;
  /** Conducta del protocolo. */
  conduct: string;
  /** Velocidad sugerida (ml/h) si hay que aumentar la infusión 20–25 %. */
  suggestedRateRange: { min: number; max: number } | null;
}

/**
 * Compara la diuresis real con la meta.
 * 🔴 por debajo de la meta · 🟢 entre la meta y 1,5 veces la meta (o el rango propio en
 * mioglobinuria) · 🟡 por encima.
 */
export function assessDiuresis(input: {
  actualMlPerHour: number;
  weightKg: number;
  target: DiuresisTarget;
  currentRateMlPerHour: number | null;
}): DiuresisAssessment {
  const actualMlPerKgH = input.actualMlPerHour / input.weightKg;
  const { minMlPerKgH, maxMlPerKgH } = input.target;
  const EPS = 1e-9;

  if (actualMlPerKgH < minMlPerKgH - EPS) {
    const suggested =
      input.currentRateMlPerHour && input.currentRateMlPerHour > 0
        ? {
            min: input.currentRateMlPerHour * (1 + DIURESIS.increaseRatePercent.min / 100),
            max: input.currentRateMlPerHour * (1 + DIURESIS.increaseRatePercent.max / 100),
          }
        : null;
    return {
      status: 'low',
      light: 'red',
      title: 'La diuresis es muy baja',
      message: `La diuresis (${actualMlPerKgH.toFixed(2)} ml/kg/h) está por debajo de la meta (${input.target.description}).`,
      actualMlPerKgH,
      conduct: `Incrementar la velocidad de infusión del Ringer Lactato entre ${DIURESIS.increaseRatePercent.min} % y ${DIURESIS.increaseRatePercent.max} %.`,
      suggestedRateRange: suggested,
    };
  }

  if (actualMlPerKgH > maxMlPerKgH + EPS) {
    return {
      status: 'high',
      light: 'yellow',
      title: 'Estás sobrehidratando al paciente',
      message: `La diuresis (${actualMlPerKgH.toFixed(2)} ml/kg/h) supera lo esperado (${input.target.description}).`,
      actualMlPerKgH,
      conduct:
        'Disminuir la velocidad de infusión para evitar el edema pulmonar o el síndrome compartimental.',
      suggestedRateRange: null,
    };
  }

  return {
    status: 'adequate',
    light: 'green',
    title: 'La diuresis es correcta, vas por buen camino',
    message: `La diuresis (${actualMlPerKgH.toFixed(2)} ml/kg/h) está dentro de lo esperado (${input.target.description}).`,
    actualMlPerKgH,
    conduct: 'Mantener la velocidad de infusión y continuar titulando hora por hora.',
    suggestedRateRange: null,
  };
}
