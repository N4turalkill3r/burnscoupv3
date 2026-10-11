import type { BurnMap, ScqMethod } from '@/shared/types/clinical';

export interface AutoSpecialAreas {
  head: boolean;
  hands: boolean;
  feet: boolean;
  genitals: boolean;
}

const isSecondOrThird = (burn: BurnMap[keyof BurnMap]) => Boolean(burn) && burn!.depth !== 'first';

/**
 * Áreas especiales (cap. 6.2) detectadas automáticamente a partir de las zonas pintadas con
 * 2.º o 3.er grado. En la regla de los nueve las manos y los pies no se distinguen, por lo que
 * deben marcarse a mano en los hallazgos.
 */
export function detectSpecialAreas(method: ScqMethod, burns: BurnMap): AutoSpecialAreas {
  if (method === 'lund_browder') {
    return {
      head: isSecondOrThird(burns.head),
      hands: isSecondOrThird(burns.hand_r) || isSecondOrThird(burns.hand_l),
      feet: isSecondOrThird(burns.foot_r) || isSecondOrThird(burns.foot_l),
      genitals: isSecondOrThird(burns.genitals),
    };
  }
  return {
    head: isSecondOrThird(burns.head_neck),
    hands: false,
    feet: false,
    genitals: isSecondOrThird(burns.perineum),
  };
}
