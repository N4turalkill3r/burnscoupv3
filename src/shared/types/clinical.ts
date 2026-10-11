/**
 * Tipos clínicos compartidos por toda la aplicación.
 * Fuente de las reglas: protocolo SEM El Salvador (ABLS 2023). Ver CLAUDE.md.
 */

/** Tipo de paciente: pediátrico hasta los 14 años, adulto desde los 15. */
export type PatientType = 'adult' | 'pediatric';

/** Tipo de quemadura con constante de reanimación propia en el protocolo. */
export type BurnType = 'thermal' | 'chemical' | 'electric_high_voltage';

/** Agente químico (solo si la quemadura es química). */
export type ChemicalAgent = 'dry_powder' | 'acid' | 'alkali' | 'unknown_liquid';

/** Profundidad (Escala de Benaim modificada). El 1.er grado NO suma a la SCQ. */
export type BurnDepth = 'first' | 'second_superficial' | 'second_deep' | 'third';

/** Método de estimación de la superficie corporal quemada. */
export type ScqMethod = 'lund_browder' | 'rule_of_nine';

/** Modelo corporal (3D) disponible. */
export type BodyModelId = 'infant' | 'child_1_4' | 'child_5_9' | 'child_10_14' | 'adult';

/** Columna de la tabla de Lund-Browder. */
export type LundBrowderColumn =
  'infant' | 'child_1_4' | 'child_5_9' | 'child_10_14' | 'age_15' | 'adult';

/** Zonas de la tabla de Lund-Browder (derecha/izquierda del paciente). */
export type LundBrowderZoneId =
  | 'head'
  | 'neck'
  | 'trunk_anterior'
  | 'trunk_posterior'
  | 'glute_r'
  | 'glute_l'
  | 'genitals'
  | 'forearm_r'
  | 'forearm_l'
  | 'arm_r'
  | 'arm_l'
  | 'hand_r'
  | 'hand_l'
  | 'thigh_r'
  | 'thigh_l'
  | 'leg_r'
  | 'leg_l'
  | 'foot_r'
  | 'foot_l';

/** Bloques de la regla de los nueve. */
export type RuleOfNineZoneId =
  | 'head_neck'
  | 'thorax_anterior'
  | 'abdomen_anterior'
  | 'upper_back'
  | 'lumbosacral'
  | 'upper_limb_r'
  | 'upper_limb_l'
  | 'lower_limb_r'
  | 'lower_limb_l'
  | 'perineum';

/** Identificador de zona de cualquiera de los dos métodos. */
export type ZoneId = LundBrowderZoneId | RuleOfNineZoneId;

/** Segmentos atómicos del modelo 3D (cada uno es una malla). */
export type SegmentId =
  | 'head'
  | 'neck'
  | 'thorax_front'
  | 'abdomen_front'
  | 'upper_back'
  | 'lower_back'
  | 'glute_r'
  | 'glute_l'
  | 'genitals'
  | 'arm_r'
  | 'arm_l'
  | 'forearm_r'
  | 'forearm_l'
  | 'hand_r'
  | 'hand_l'
  | 'thigh_r'
  | 'thigh_l'
  | 'leg_r'
  | 'leg_l'
  | 'foot_r'
  | 'foot_l';

/** Cuánto de la zona está quemada. */
export type Coverage =
  | { kind: 'full' }
  | { kind: 'fraction'; value: number } // 0 < value <= 1
  | { kind: 'palms'; count: number }; // cada palma con dedos = 1 % de la SC total

/** Quemadura registrada en una zona. */
export interface ZoneBurn {
  depth: BurnDepth;
  coverage: Coverage;
}

/** Mapa de zonas quemadas de un método. */
export type BurnMap = Partial<Record<ZoneId, ZoneBurn>>;
