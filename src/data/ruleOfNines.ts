/**
 * Regla de los nueve (Wallace) y su modificación pediátrica.
 * Fuente: cap. 1.2 y 4.2 del protocolo.
 */

/** Valores del adulto y adolescente (≥ 14 años según el PDF). */
export const ADULT_NINES = {
  headNeck: 9,
  thoraxAnterior: 9,
  abdomenAnterior: 9,
  upperBack: 9,
  lumbosacral: 9,
  upperLimbEach: 9,
  lowerLimbEach: 18,
  perineum: 1,
} as const;

/** Lactante: cabeza y cuello 18 %, cada pierna 14 %. */
export const INFANT_HEAD_NECK = 18;
export const INFANT_LEG_EACH = 14;

/** Por cada año de edad mayor de 1: −1 % a la cabeza, +0,5 % a cada pierna. */
export const HEAD_DECREASE_PER_YEAR = 1;
export const LEG_INCREASE_PER_YEAR = 0.5;
