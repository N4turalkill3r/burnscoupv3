import { describe, expect, it } from 'vitest';
import { LB_ZONE_SEGMENTS, NINE_ZONE_SEGMENTS, zoneOfSegment } from '@/data/zones';
import {
  ALL_SEGMENT_IDS,
  BODY_PROPORTIONS,
  buildBodyLayout,
} from '@/features/body-model/bodyLayout';
import { BODY_MODELS } from '@/features/burn-calculation/age';

describe('buildBodyLayout', () => {
  it.each(BODY_MODELS)('el modelo %s tiene los 21 segmentos, cada uno una sola vez', (model) => {
    const layout = buildBodyLayout(model);
    const ids = layout.segments.map((s) => s.id).sort();
    expect(ids).toEqual([...ALL_SEGMENT_IDS].sort());
    expect(new Set(ids).size).toBe(ALL_SEGMENT_IDS.length);
  });

  it.each(BODY_MODELS)('el modelo %s tiene primitivas con medidas válidas', (model) => {
    for (const segment of buildBodyLayout(model).segments) {
      expect(segment.primitives.length).toBeGreaterThan(0);
      for (const p of segment.primitives) {
        if (p.shape === 'ellipsoid') {
          expect(p.radii.every((r) => r > 0)).toBe(true);
        } else {
          expect(p.height).toBeGreaterThan(0);
          expect(p.radiusTop).toBeGreaterThan(0);
          expect(p.radiusBottom).toBeGreaterThan(0);
          expect(p.arcLength).toBeGreaterThan(0);
        }
      }
    }
  });

  it('el lado derecho del paciente queda en −X y el izquierdo en +X', () => {
    const layout = buildBodyLayout('adult');
    const xOf = (id: string) =>
      layout.segments.find((s) => s.id === id)!.primitives[0]!.position[0];
    expect(xOf('thigh_r')).toBeLessThan(0);
    expect(xOf('thigh_l')).toBeGreaterThan(0);
    expect(xOf('arm_r')).toBeLessThan(0);
    expect(xOf('arm_l')).toBeGreaterThan(0);
  });

  it('los modelos pediátricos son más pequeños y de cabeza proporcionalmente mayor', () => {
    const order = ['infant', 'child_1_4', 'child_5_9', 'child_10_14', 'adult'] as const;
    const heights = order.map((m) => buildBodyLayout(m).height);
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(BODY_PROPORTIONS.infant.head).toBeGreaterThan(BODY_PROPORTIONS.adult.head);
  });

  it('la altura del adulto es realista (1,6 a 1,9 m)', () => {
    const { height } = buildBodyLayout('adult');
    expect(height).toBeGreaterThan(1.6);
    expect(height).toBeLessThan(1.9);
  });
});

describe('segmentos y zonas', () => {
  const lbSegments = Object.values(LB_ZONE_SEGMENTS).flat();
  const nineSegments = Object.values(NINE_ZONE_SEGMENTS).flat();

  it('cada segmento pertenece exactamente a una zona de Lund-Browder y a una de la regla de los nueve', () => {
    expect([...lbSegments].sort()).toEqual([...ALL_SEGMENT_IDS].sort());
    expect([...nineSegments].sort()).toEqual([...ALL_SEGMENT_IDS].sort());
  });

  it('zoneOfSegment resuelve el bloque según el método', () => {
    expect(zoneOfSegment('lund_browder', 'thorax_front')).toBe('trunk_anterior');
    expect(zoneOfSegment('rule_of_nine', 'thorax_front')).toBe('thorax_anterior');
    expect(zoneOfSegment('rule_of_nine', 'glute_r')).toBe('lumbosacral');
    expect(zoneOfSegment('lund_browder', 'glute_r')).toBe('glute_r');
  });
});
