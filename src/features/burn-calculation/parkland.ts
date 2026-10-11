import {
  ADULT_CONSTANT_MIN_AGE,
  FIRST_BLOCK_FRACTION,
  FIRST_BLOCK_HOURS,
  INITIAL_RATE_BANDS,
  PARKLAND_CONSTANT,
  PARKLAND_CONSTANT_RANGE,
  SECOND_BLOCK_HOURS,
  TOTAL_RESUSCITATION_HOURS,
} from '@/data/fluidProtocol';
import type { BurnType } from '@/shared/types/clinical';

/**
 * Constante de Parkland propuesta por defecto (ml/kg/%SCQ):
 * eléctrica de alto voltaje 4; ≥ 14 años 2; < 14 años 3.
 * El usuario puede escribir otro valor.
 */
export function defaultParklandConstant(input: { burnType: BurnType; age: number }): number {
  if (input.burnType === 'electric_high_voltage') return PARKLAND_CONSTANT.electricHighVoltage;
  return input.age >= ADULT_CONSTANT_MIN_AGE
    ? PARKLAND_CONSTANT.adult
    : PARKLAND_CONSTANT.pediatric;
}

export function isConstantInProtocolRange(constant: number): boolean {
  return constant >= PARKLAND_CONSTANT_RANGE.min && constant <= PARKLAND_CONSTANT_RANGE.max;
}

/** Volumen total de Ringer Lactato de las primeras 24 h (ml) = constante × peso × %SCQ. */
export function totalVolume24h(input: {
  constant: number;
  weightKg: number;
  scqPercent: number;
}): number {
  return input.constant * input.weightKg * input.scqPercent;
}

export interface InfusionBlock {
  id: 'first' | 'second' | 'remaining';
  label: string;
  volumeMl: number;
  durationHours: number;
  rateMlPerHour: number;
  /** Horas desde la quemadura en que inicia / termina el bloque. */
  startHourFromBurn: number;
  endHourFromBurn: number;
}

export interface InfusionSchedule {
  status: 'on_time' | 'late' | 'beyond_24h' | 'invalid';
  elapsedHours: number;
  blocks: InfusionBlock[];
  warnings: string[];
}

/**
 * Reparte el volumen de 24 h desde la hora de la quemadura.
 *
 * - t < 8 h: 50 % en las (8 − t) h restantes del primer bloque y 50 % en las 16 h siguientes.
 * - 8 h ≤ t < 24 h: 100 % del volumen en las (24 − t) h restantes (decisión del usuario).
 * - t ≥ 24 h: fuera de protocolo.
 */
export function buildInfusionSchedule(volumeMl: number, elapsedHours: number): InfusionSchedule {
  const warnings: string[] = [];

  if (!Number.isFinite(elapsedHours) || elapsedHours < 0) {
    return {
      status: 'invalid',
      elapsedHours,
      blocks: [],
      warnings: ['La hora de llegada del equipo no puede ser anterior a la hora de la quemadura.'],
    };
  }

  if (elapsedHours >= TOTAL_RESUSCITATION_HOURS) {
    return {
      status: 'beyond_24h',
      elapsedHours,
      blocks: [],
      warnings: [
        'Han pasado 24 h o más desde la quemadura: fuera del esquema del protocolo. Requiere valoración médica.',
      ],
    };
  }

  if (elapsedHours < FIRST_BLOCK_HOURS) {
    const firstDuration = FIRST_BLOCK_HOURS - elapsedHours;
    const firstVolume = volumeMl * FIRST_BLOCK_FRACTION;
    const secondVolume = volumeMl - firstVolume;
    if (elapsedHours > 0 && firstDuration < 1) {
      warnings.push(
        'Queda menos de 1 hora del primer bloque: la velocidad calculada es muy alta. Verifíquela con la indicación médica.',
      );
    }
    return {
      status: elapsedHours > 0 ? 'late' : 'on_time',
      elapsedHours,
      warnings,
      blocks: [
        {
          id: 'first',
          label: 'Primer 50 % (hasta la hora 8 desde la quemadura)',
          volumeMl: firstVolume,
          durationHours: firstDuration,
          rateMlPerHour: firstVolume / firstDuration,
          startHourFromBurn: elapsedHours,
          endHourFromBurn: FIRST_BLOCK_HOURS,
        },
        {
          id: 'second',
          label: 'Segundo 50 % (horas 8 a 24)',
          volumeMl: secondVolume,
          durationHours: SECOND_BLOCK_HOURS,
          rateMlPerHour: secondVolume / SECOND_BLOCK_HOURS,
          startHourFromBurn: FIRST_BLOCK_HOURS,
          endHourFromBurn: TOTAL_RESUSCITATION_HOURS,
        },
      ],
    };
  }

  const remaining = TOTAL_RESUSCITATION_HOURS - elapsedHours;
  if (remaining < 1) {
    warnings.push(
      'Queda menos de 1 hora para completar las 24 h: la velocidad calculada es muy alta. Verifíquela con la indicación médica.',
    );
  }
  return {
    status: 'late',
    elapsedHours,
    warnings: [
      'Ya pasaron 8 h o más desde la quemadura: el 100 % del volumen se administra en las horas restantes hasta completar las 24 h.',
      ...warnings,
    ],
    blocks: [
      {
        id: 'remaining',
        label: '100 % del volumen en las horas restantes (hasta la hora 24)',
        volumeMl,
        durationHours: remaining,
        rateMlPerHour: volumeMl / remaining,
        startHourFromBurn: elapsedHours,
        endHourFromBurn: TOTAL_RESUSCITATION_HOURS,
      },
    ],
  };
}

/** Fluidoterapia inicial por horas (Ringer Lactato) antes de cuantificar la SCQ. */
export function initialRateMlPerHour(age: number): number {
  const band = INITIAL_RATE_BANDS.find((b) => age <= b.maxAge);
  return (band ?? INITIAL_RATE_BANDS[INITIAL_RATE_BANDS.length - 1]!).mlPerHour;
}

export function initialRateBandLabel(age: number): string {
  const band = INITIAL_RATE_BANDS.find((b) => age <= b.maxAge);
  return (band ?? INITIAL_RATE_BANDS[INITIAL_RATE_BANDS.length - 1]!).label;
}
