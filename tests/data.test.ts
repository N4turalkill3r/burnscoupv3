import { describe, expect, it } from 'vitest';
import { LUND_BROWDER_COLUMNS, LUND_BROWDER_TABLE } from '@/data/lundBrowder';
import { LB_ZONE_SEGMENTS, NINE_ZONE_SEGMENTS } from '@/data/zones';
import type { SegmentId } from '@/shared/types/clinical';

describe('tabla de Lund-Browder', () => {
  it.each(LUND_BROWDER_COLUMNS)('la columna %s suma 100 %%', (column) => {
    const sum = Object.values(LUND_BROWDER_TABLE).reduce((acc, row) => acc + row[column], 0);
    expect(sum).toBeCloseTo(100, 6);
  });
});

describe('zonas y segmentos 3D', () => {
  const allSegments = (map: Record<string, readonly SegmentId[]>) =>
    Object.values(map).flat().sort();

  it('Lund-Browder y regla de los nueve cubren exactamente los mismos segmentos, sin repetir', () => {
    const lb = allSegments(LB_ZONE_SEGMENTS);
    const nines = allSegments(NINE_ZONE_SEGMENTS);
    expect(lb).toEqual(nines);
    expect(new Set(lb).size).toBe(lb.length);
    expect(lb).toHaveLength(21);
  });
});
