/**
 * Constantes de la reanimación hídrica y de la diuresis.
 * Fuente: cap. 2 (C.3), 3, 4 y 5.2 del protocolo.
 */

/** Rango general de la constante de Parkland modificada (ml/kg/%SCQ). */
export const PARKLAND_CONSTANT_RANGE = { min: 2, max: 4 } as const;

export const PARKLAND_CONSTANT = {
  /** Adultos y adolescentes (≥ 14 años), térmica o química. */
  adult: 2,
  /** Pediátricos (< 14 años), térmica o química. */
  pediatric: 3,
  /** Eléctrica de alto voltaje, todas las edades. */
  electricHighVoltage: 4,
} as const;

/** Edad desde la cual se aplica la constante de adulto (según el PDF). */
export const ADULT_CONSTANT_MIN_AGE = 14;

/** Pauta de administración en las primeras 24 h desde la quemadura. */
export const FIRST_BLOCK_HOURS = 8;
export const SECOND_BLOCK_HOURS = 16;
export const TOTAL_RESUSCITATION_HOURS = FIRST_BLOCK_HOURS + SECOND_BLOCK_HOURS;
export const FIRST_BLOCK_FRACTION = 0.5;

/** Fluidoterapia inicial por horas (fase pre-cálculo de SCQ). */
export const INITIAL_RATE_BANDS = [
  { maxAge: 5, mlPerHour: 125, label: '≤ 5 años' },
  { maxAge: 12, mlPerHour: 250, label: '6 a 12 años' },
  { maxAge: 200, mlPerHour: 500, label: '≥ 13 años y adultos' },
] as const;

/** Metas de diuresis (ml/kg/h). */
export const DIURESIS = {
  adultTarget: 0.5,
  pediatricTarget: 1.0,
  /** Por debajo de este peso (kg) se usa la meta pediátrica. */
  pediatricWeightLimitKg: 30,
  /** Electricidad con orina pigmentada (mioglobinuria). */
  myoglobinuriaAdult: { min: 1.0, max: 1.5 },
  myoglobinuriaChild: { min: 1.5, max: 2.0 },
  /** Verde hasta esta proporción de la meta; por encima, amarillo (decisión del usuario). */
  greenUpperRatio: 1.5,
  /** Si la diuresis es baja, aumentar la infusión entre estos porcentajes. */
  increaseRatePercent: { min: 20, max: 25 },
} as const;

/** Edad máxima (incluida) en la que se considera paciente pediátrico. */
export const PEDIATRIC_MAX_AGE = 14;

/** Edad máxima con mantenimiento basal por decisión del usuario (14 es criterio especial). */
export const MAINTENANCE_PROTOCOL_MAX_AGE = 13;
export const MAINTENANCE_SPECIAL_CRITERION_AGE = 14;
