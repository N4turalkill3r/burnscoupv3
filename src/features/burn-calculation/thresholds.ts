import { SCQ_THRESHOLD_BANDS, type ScqThresholdBand } from '@/data/thresholds';

/** Umbral de SCQ (%) que activa la reanimación hídrica masiva según la edad. */
export function scqThresholdForAge(age: number): ScqThresholdBand {
  const band = SCQ_THRESHOLD_BANDS.find((b) => age >= b.minAge && age <= b.maxAge);
  if (!band) throw new Error(`Edad fuera de rango para el umbral de SCQ: ${age}`);
  return band;
}

/** "Supera" significa estrictamente mayor que el umbral (p. ej. > 20 % en adultos). */
export function exceedsScqThreshold(scqPercent: number, age: number): boolean {
  return scqPercent > scqThresholdForAge(age).thresholdPercent;
}
