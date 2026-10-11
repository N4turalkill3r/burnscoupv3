import { LUND_BROWDER_TABLE } from '@/data/lundBrowder';
import { ADULT_NINES } from '@/data/ruleOfNines';
import { ZONE_LABEL, ZONES_BY_METHOD } from '@/data/zones';
import type {
  BurnDepth,
  BurnMap,
  Coverage,
  LundBrowderColumn,
  LundBrowderZoneId,
  RuleOfNineZoneId,
  ScqMethod,
  ZoneBurn,
  ZoneId,
} from '@/shared/types/clinical';
import { ruleOfNineValues } from './ruleOfNines';

/** Un % de superficie corporal (palma con dedos extendidos). */
export const PALM_PERCENT = 1;

/** % de superficie corporal que vale cada zona para un método y una edad/columna. */
export function zoneValues(
  method: ScqMethod,
  ctx: { age: number; column: LundBrowderColumn },
): Record<string, number> {
  if (method === 'lund_browder') {
    const out: Record<string, number> = {};
    for (const zone of Object.keys(LUND_BROWDER_TABLE) as LundBrowderZoneId[]) {
      out[zone] = LUND_BROWDER_TABLE[zone][ctx.column];
    }
    return out;
  }
  return ruleOfNineValues(ctx.age) as Record<RuleOfNineZoneId, number>;
}

/** Fracción (0–1) de la zona que está quemada. */
export function coverageFraction(coverage: Coverage, zoneValue: number): number {
  if (zoneValue <= 0) return 0;
  switch (coverage.kind) {
    case 'full':
      return 1;
    case 'fraction':
      return Math.min(1, Math.max(0, coverage.value));
    case 'palms':
      return Math.min(1, Math.max(0, (coverage.count * PALM_PERCENT) / zoneValue));
  }
}

/** % de SC quemada en una zona. */
export function zonePercent(burn: ZoneBurn, zoneValue: number): number {
  return zoneValue * coverageFraction(burn.coverage, zoneValue);
}

export interface BurnedZoneSummary {
  zoneId: ZoneId;
  label: string;
  depth: BurnDepth;
  zoneValue: number;
  percent: number;
  /** Cuenta para la SCQ de fluidoterapia (2.º y 3.er grado). */
  countsForScq: boolean;
}

export interface ScqResult {
  /** SCQ de fluidoterapia: 2.º (superficial y profundo) + 3.er grado. */
  total: number;
  secondSuperficial: number;
  secondDeep: number;
  second: number;
  third: number;
  /** 1.er grado: se pinta pero NO suma al total. */
  first: number;
  zones: BurnedZoneSummary[];
}

const COUNTS_FOR_SCQ: Record<BurnDepth, boolean> = {
  first: false,
  second_superficial: true,
  second_deep: true,
  third: true,
};

export function calculateScq(
  method: ScqMethod,
  burns: BurnMap,
  ctx: { age: number; column: LundBrowderColumn },
): ScqResult {
  const values = zoneValues(method, ctx);
  const result: ScqResult = {
    total: 0,
    secondSuperficial: 0,
    secondDeep: 0,
    second: 0,
    third: 0,
    first: 0,
    zones: [],
  };

  for (const zoneId of ZONES_BY_METHOD[method]) {
    const burn = burns[zoneId];
    if (!burn) continue;
    const zoneValue = values[zoneId] ?? 0;
    const percent = zonePercent(burn, zoneValue);
    if (percent <= 0) continue;
    result.zones.push({
      zoneId,
      label: ZONE_LABEL[zoneId],
      depth: burn.depth,
      zoneValue,
      percent,
      countsForScq: COUNTS_FOR_SCQ[burn.depth],
    });
    switch (burn.depth) {
      case 'first':
        result.first += percent;
        break;
      case 'second_superficial':
        result.secondSuperficial += percent;
        break;
      case 'second_deep':
        result.secondDeep += percent;
        break;
      case 'third':
        result.third += percent;
        break;
    }
  }

  result.second = result.secondSuperficial + result.secondDeep;
  result.total = result.second + result.third;
  return result;
}

/** Suma de todos los bloques del adulto (útil para pruebas). */
export const ADULT_NINES_TOTAL =
  ADULT_NINES.headNeck +
  ADULT_NINES.thoraxAnterior +
  ADULT_NINES.abdomenAnterior +
  ADULT_NINES.upperBack +
  ADULT_NINES.lumbosacral +
  ADULT_NINES.upperLimbEach * 2 +
  ADULT_NINES.lowerLimbEach * 2 +
  ADULT_NINES.perineum;
