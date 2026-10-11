import {
  ADULT_NINES,
  HEAD_DECREASE_PER_YEAR,
  INFANT_HEAD_NECK,
  INFANT_LEG_EACH,
  LEG_INCREASE_PER_YEAR,
} from '@/data/ruleOfNines';
import type { RuleOfNineZoneId } from '@/shared/types/clinical';

/**
 * Valores de cada bloque de la regla de los nueve según la edad (años cumplidos).
 *
 * - Adulto y adolescente: valores de Wallace.
 * - Pediátrico: nota del protocolo (decisión del usuario). Lactante: cabeza y cuello 18 %,
 *   cada pierna 14 %. Por cada año mayor de 1 se resta 1 % a la cabeza y se suma 0,5 % a
 *   cada pierna, con topes de adulto (cabeza ≥ 9 %, pierna ≤ 18 %).
 *
 * Nota: los valores base del PDF suman 101 % en edades pediátricas (el 1 % del periné se
 * cuenta aparte); desde los 10 años suman 100 %.
 */
export function ruleOfNineValues(age: number): Record<RuleOfNineZoneId, number> {
  const yearsOverOne = Math.max(0, age - 1);
  const headNeck = Math.max(
    ADULT_NINES.headNeck,
    INFANT_HEAD_NECK - HEAD_DECREASE_PER_YEAR * yearsOverOne,
  );
  const legEach = Math.min(
    ADULT_NINES.lowerLimbEach,
    INFANT_LEG_EACH + LEG_INCREASE_PER_YEAR * yearsOverOne,
  );
  const isAdultProportion = age >= 14;

  return {
    head_neck: isAdultProportion ? ADULT_NINES.headNeck : headNeck,
    thorax_anterior: ADULT_NINES.thoraxAnterior,
    abdomen_anterior: ADULT_NINES.abdomenAnterior,
    upper_back: ADULT_NINES.upperBack,
    lumbosacral: ADULT_NINES.lumbosacral,
    upper_limb_r: ADULT_NINES.upperLimbEach,
    upper_limb_l: ADULT_NINES.upperLimbEach,
    lower_limb_r: isAdultProportion ? ADULT_NINES.lowerLimbEach : legEach,
    lower_limb_l: isAdultProportion ? ADULT_NINES.lowerLimbEach : legEach,
    perineum: ADULT_NINES.perineum,
  };
}
