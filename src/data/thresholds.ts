/**
 * Umbrales de SCQ (%) que activan el protocolo de reanimación hídrica masiva (SIRS).
 * Fuente: cap. 1.3 del protocolo, con los límites de edad definidos por el usuario.
 * La edad se maneja en años cumplidos (entero).
 */
export interface ScqThresholdBand {
  id: string;
  label: string;
  /** Edad mínima incluida. */
  minAge: number;
  /** Edad máxima incluida. */
  maxAge: number;
  thresholdPercent: number;
}

export const SCQ_THRESHOLD_BANDS: readonly ScqThresholdBand[] = [
  { id: 'under_3', label: 'Niños menores de 3 años', minAge: 0, maxAge: 2, thresholdPercent: 5 },
  { id: '3_to_10', label: 'Niños de 3 a 10 años', minAge: 3, maxAge: 10, thresholdPercent: 10 },
  { id: '11_to_14', label: 'Niños de 10 a 14 años', minAge: 11, maxAge: 14, thresholdPercent: 15 },
  { id: 'adult', label: 'Adultos', minAge: 15, maxAge: 64, thresholdPercent: 20 },
  {
    id: 'older_adult',
    label: 'Adultos mayores (≥ 65 años)',
    minAge: 65,
    maxAge: 150,
    thresholdPercent: 10,
  },
];
