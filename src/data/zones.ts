import type {
  LundBrowderZoneId,
  RuleOfNineZoneId,
  ScqMethod,
  SegmentId,
  ZoneId,
} from '@/shared/types/clinical';

/** Nombre en español de cada zona. */
export const ZONE_LABEL: Record<ZoneId, string> = {
  // Lund-Browder
  head: 'Cabeza',
  neck: 'Cuello',
  trunk_anterior: 'Tronco anterior',
  trunk_posterior: 'Tronco posterior',
  glute_r: 'Glúteo derecho',
  glute_l: 'Glúteo izquierdo',
  genitals: 'Genitales',
  forearm_r: 'Antebrazo derecho',
  forearm_l: 'Antebrazo izquierdo',
  arm_r: 'Brazo derecho',
  arm_l: 'Brazo izquierdo',
  hand_r: 'Mano derecha',
  hand_l: 'Mano izquierda',
  thigh_r: 'Muslo derecho',
  thigh_l: 'Muslo izquierdo',
  leg_r: 'Pierna derecha',
  leg_l: 'Pierna izquierda',
  foot_r: 'Pie derecho',
  foot_l: 'Pie izquierdo',
  // Regla de los nueve
  head_neck: 'Cabeza y cuello',
  thorax_anterior: 'Tórax anterior',
  abdomen_anterior: 'Abdomen anterior',
  upper_back: 'Dorso superior',
  lumbosacral: 'Región lumbosacra (incluye glúteos)',
  upper_limb_r: 'Miembro superior derecho',
  upper_limb_l: 'Miembro superior izquierdo',
  lower_limb_r: 'Miembro inferior derecho',
  lower_limb_l: 'Miembro inferior izquierdo',
  perineum: 'Periné y genitales',
};

/** Zonas de cada método, en el orden en que se listan en pantalla. */
export const LUND_BROWDER_ZONES: readonly LundBrowderZoneId[] = [
  'head',
  'neck',
  'trunk_anterior',
  'trunk_posterior',
  'glute_r',
  'glute_l',
  'genitals',
  'arm_r',
  'arm_l',
  'forearm_r',
  'forearm_l',
  'hand_r',
  'hand_l',
  'thigh_r',
  'thigh_l',
  'leg_r',
  'leg_l',
  'foot_r',
  'foot_l',
];

export const RULE_OF_NINE_ZONES: readonly RuleOfNineZoneId[] = [
  'head_neck',
  'thorax_anterior',
  'abdomen_anterior',
  'upper_back',
  'lumbosacral',
  'upper_limb_r',
  'upper_limb_l',
  'lower_limb_r',
  'lower_limb_l',
  'perineum',
];

export const ZONES_BY_METHOD: Record<ScqMethod, readonly ZoneId[]> = {
  lund_browder: LUND_BROWDER_ZONES,
  rule_of_nine: RULE_OF_NINE_ZONES,
};

/** Qué segmentos 3D componen cada zona de Lund-Browder. */
export const LB_ZONE_SEGMENTS: Record<LundBrowderZoneId, readonly SegmentId[]> = {
  head: ['head'],
  neck: ['neck'],
  trunk_anterior: ['thorax_front', 'abdomen_front'],
  trunk_posterior: ['upper_back', 'lower_back'],
  glute_r: ['glute_r'],
  glute_l: ['glute_l'],
  genitals: ['genitals'],
  forearm_r: ['forearm_r'],
  forearm_l: ['forearm_l'],
  arm_r: ['arm_r'],
  arm_l: ['arm_l'],
  hand_r: ['hand_r'],
  hand_l: ['hand_l'],
  thigh_r: ['thigh_r'],
  thigh_l: ['thigh_l'],
  leg_r: ['leg_r'],
  leg_l: ['leg_l'],
  foot_r: ['foot_r'],
  foot_l: ['foot_l'],
};

/** Qué segmentos 3D componen cada bloque de la regla de los nueve. */
export const NINE_ZONE_SEGMENTS: Record<RuleOfNineZoneId, readonly SegmentId[]> = {
  head_neck: ['head', 'neck'],
  thorax_anterior: ['thorax_front'],
  abdomen_anterior: ['abdomen_front'],
  upper_back: ['upper_back'],
  lumbosacral: ['lower_back', 'glute_r', 'glute_l'],
  upper_limb_r: ['arm_r', 'forearm_r', 'hand_r'],
  upper_limb_l: ['arm_l', 'forearm_l', 'hand_l'],
  lower_limb_r: ['thigh_r', 'leg_r', 'foot_r'],
  lower_limb_l: ['thigh_l', 'leg_l', 'foot_l'],
  perineum: ['genitals'],
};

/** Zona (de un método) a la que pertenece un segmento 3D. */
export function zoneOfSegment(method: ScqMethod, segment: SegmentId): ZoneId {
  const map: Record<string, readonly SegmentId[]> =
    method === 'lund_browder' ? LB_ZONE_SEGMENTS : NINE_ZONE_SEGMENTS;
  for (const zone of Object.keys(map)) {
    if (map[zone]?.includes(segment)) return zone as ZoneId;
  }
  throw new Error(`Segmento sin zona: ${segment}`);
}

/** Segmentos 3D de una zona de cualquiera de los dos métodos. */
export function segmentsOfZone(method: ScqMethod, zone: ZoneId): readonly SegmentId[] {
  const map: Record<string, readonly SegmentId[]> =
    method === 'lund_browder' ? LB_ZONE_SEGMENTS : NINE_ZONE_SEGMENTS;
  return map[zone] ?? [];
}
