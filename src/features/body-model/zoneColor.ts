import { Color } from 'three';
import { DEPTH_BY_ID, SKIN_COLOR } from '@/data/depths';
import { coverageFraction } from '@/features/burn-calculation/scq';
import type { ZoneBurn } from '@/shared/types/clinical';

const skin = new Color(SKIN_COLOR);

/**
 * Color con que se dibuja una zona: piel si no hay quemadura; si la hay, el color de la
 * profundidad, más tenue cuanto menor es la fracción de la zona marcada.
 */
export function zoneColor(burn: ZoneBurn | undefined, zoneValue: number): string {
  if (!burn) return SKIN_COLOR;
  const fraction = coverageFraction(burn.coverage, zoneValue);
  const mixed = skin.clone().lerp(new Color(DEPTH_BY_ID[burn.depth].color), 0.4 + 0.6 * fraction);
  return `#${mixed.getHexString()}`;
}
