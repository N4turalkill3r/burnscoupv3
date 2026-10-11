import {
  MAINTENANCE_PROTOCOL_MAX_AGE,
  MAINTENANCE_SPECIAL_CRITERION_AGE,
} from '@/data/fluidProtocol';

/**
 * Líquidos de mantenimiento basal (regla de Holliday-Segar 4-2-1), en ml/h:
 * 4 ml/kg/h los primeros 10 kg + 2 ml/kg/h del kg 11 al 20 + 1 ml/kg/h por kg sobre 20.
 */
export function hollidaySegarMlPerHour(weightKg: number): number {
  const first = Math.min(weightKg, 10) * 4;
  const second = Math.min(Math.max(weightKg - 10, 0), 10) * 2;
  const third = Math.max(weightKg - 20, 0) * 1;
  return first + second + third;
}

export interface MaintenancePlan {
  applies: boolean;
  mlPerHour: number;
  /** A los 14 años se incluye por decisión del usuario, fuera del protocolo. */
  specialCriterion: boolean;
}

/** Mantenimiento: protocolo < 14 años; los 14 años se incluyen como criterio especial. */
export function maintenancePlan(age: number, weightKg: number): MaintenancePlan {
  const applies = age <= MAINTENANCE_SPECIAL_CRITERION_AGE;
  return {
    applies,
    mlPerHour: applies ? hollidaySegarMlPerHour(weightKg) : 0,
    specialCriterion:
      age > MAINTENANCE_PROTOCOL_MAX_AGE && age <= MAINTENANCE_SPECIAL_CRITERION_AGE,
  };
}
