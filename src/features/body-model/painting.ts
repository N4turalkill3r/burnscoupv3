import type { BurnDepth, BurnMap, Coverage, ZoneId } from '@/shared/types/clinical';

/** Pincel: profundidad (o borrar) y cuánto de la zona se marca. */
export type BrushDepth = BurnDepth | 'erase';

export interface Brush {
  depth: BrushDepth;
  coverage: Coverage;
}

export const DEFAULT_BRUSH: Brush = { depth: 'second_superficial', coverage: { kind: 'full' } };

const sameCoverage = (a: Coverage, b: Coverage): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'fraction' && b.kind === 'fraction') return a.value === b.value;
  if (a.kind === 'palms' && b.kind === 'palms') return a.count === b.count;
  return true;
};

/**
 * Aplica el pincel a una zona y devuelve un mapa nuevo. Si el resultado es idéntico al
 * actual devuelve el mismo objeto (evita renderizados al arrastrar sobre la misma zona).
 */
export function paintZone(map: BurnMap, zone: ZoneId, brush: Brush): BurnMap {
  const current = map[zone];

  if (brush.depth === 'erase') {
    if (!current) return map;
    const next = { ...map };
    delete next[zone];
    return next;
  }

  if (current && current.depth === brush.depth && sameCoverage(current.coverage, brush.coverage)) {
    return map;
  }
  return { ...map, [zone]: { depth: brush.depth, coverage: brush.coverage } };
}

/** Texto corto de cuánto de la zona está marcado. */
export function coverageLabel(coverage: Coverage): string {
  switch (coverage.kind) {
    case 'full':
      return 'Bloque completo';
    case 'fraction':
      return `${Math.round(coverage.value * 100)} % de la zona`;
    case 'palms':
      return `${coverage.count} ${coverage.count === 1 ? 'palma' : 'palmas'}`;
  }
}
