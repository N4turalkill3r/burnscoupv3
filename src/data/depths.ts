import type { BurnDepth } from '@/shared/types/clinical';

/** Profundidad de la quemadura: etiquetas y colores del modelo 3D. */
export interface DepthInfo {
  id: BurnDepth;
  label: string;
  short: string;
  /** Color con el que se pinta la zona en el modelo 3D. */
  color: string;
  /** Si suma a la SCQ de fluidoterapia (el 1.er grado se pinta pero no suma). */
  countsForScq: boolean;
}

export const BURN_DEPTHS: readonly DepthInfo[] = [
  { id: 'first', label: '1.er grado', short: '1.º', color: '#f2a7a0', countsForScq: false },
  {
    id: 'second_superficial',
    label: '2.º superficial',
    short: '2.º sup.',
    color: '#e0474c',
    countsForScq: true,
  },
  {
    id: 'second_deep',
    label: '2.º profundo',
    short: '2.º prof.',
    color: '#9c1f2e',
    countsForScq: true,
  },
  { id: 'third', label: '3.er grado', short: '3.º', color: '#2e211d', countsForScq: true },
];

export const DEPTH_BY_ID: Record<BurnDepth, DepthInfo> = Object.fromEntries(
  BURN_DEPTHS.map((d) => [d.id, d]),
) as Record<BurnDepth, DepthInfo>;

/** Color de la piel sin quemadura en el modelo. */
export const SKIN_COLOR = '#d8c3b4';
