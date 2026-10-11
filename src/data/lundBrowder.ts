import type { LundBrowderColumn, LundBrowderZoneId } from '@/shared/types/clinical';

/**
 * Tabla de Lund-Browder (% de superficie corporal por zona).
 * Fuente: imagen aportada por el usuario (cada columna suma 100 %).
 * Los valores de las zonas pares (derecha/izquierda) son "por cada lado".
 */
export const LUND_BROWDER_COLUMNS: readonly LundBrowderColumn[] = [
  'infant',
  'child_1_4',
  'child_5_9',
  'child_10_14',
  'age_15',
  'adult',
];

type Row = Record<LundBrowderColumn, number>;
const row = (
  infant: number,
  child_1_4: number,
  child_5_9: number,
  child_10_14: number,
  age_15: number,
  adult: number,
): Row => ({ infant, child_1_4, child_5_9, child_10_14, age_15, adult });

export const LUND_BROWDER_TABLE: Record<LundBrowderZoneId, Row> = {
  head: row(19, 17, 13, 11, 9, 7),
  neck: row(2, 2, 2, 2, 2, 2),
  trunk_anterior: row(13, 13, 13, 13, 13, 13),
  trunk_posterior: row(13, 13, 13, 13, 13, 13),
  glute_r: row(2.5, 2.5, 2.5, 2.5, 2.5, 2.5),
  glute_l: row(2.5, 2.5, 2.5, 2.5, 2.5, 2.5),
  genitals: row(1, 1, 1, 1, 1, 1),
  forearm_r: row(4, 4, 4, 4, 4, 4),
  forearm_l: row(4, 4, 4, 4, 4, 4),
  arm_r: row(3, 3, 3, 3, 3, 3),
  arm_l: row(3, 3, 3, 3, 3, 3),
  hand_r: row(2.5, 2.5, 2.5, 2.5, 2.5, 2.5),
  hand_l: row(2.5, 2.5, 2.5, 2.5, 2.5, 2.5),
  thigh_r: row(5.5, 6.5, 8, 8.5, 9, 9.5),
  thigh_l: row(5.5, 6.5, 8, 8.5, 9, 9.5),
  leg_r: row(5, 5, 5.5, 6, 6.5, 7),
  leg_l: row(5, 5, 5.5, 6, 6.5, 7),
  foot_r: row(3.5, 3.5, 3.5, 3.5, 3.5, 3.5),
  foot_l: row(3.5, 3.5, 3.5, 3.5, 3.5, 3.5),
};

export const LUND_BROWDER_COLUMN_LABEL: Record<LundBrowderColumn, string> = {
  infant: 'Nac.–1 año',
  child_1_4: '1–4 años',
  child_5_9: '5–9 años',
  child_10_14: '10–14 años',
  age_15: '15 años',
  adult: 'Adulto',
};
