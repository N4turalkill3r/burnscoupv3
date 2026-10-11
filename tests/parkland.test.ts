import { describe, expect, it } from 'vitest';
import {
  buildInfusionSchedule,
  defaultParklandConstant,
  initialRateMlPerHour,
  isConstantInProtocolRange,
  totalVolume24h,
} from '@/features/burn-calculation/parkland';

describe('constante por defecto', () => {
  it('eléctrica de alto voltaje = 4 sin importar la edad', () => {
    expect(defaultParklandConstant({ burnType: 'electric_high_voltage', age: 5 })).toBe(4);
    expect(defaultParklandConstant({ burnType: 'electric_high_voltage', age: 40 })).toBe(4);
  });
  it('adultos y adolescentes ≥ 14 años = 2; pediátricos < 14 años = 3', () => {
    expect(defaultParklandConstant({ burnType: 'thermal', age: 30 })).toBe(2);
    expect(defaultParklandConstant({ burnType: 'chemical', age: 14 })).toBe(2);
    expect(defaultParklandConstant({ burnType: 'thermal', age: 13 })).toBe(3);
    expect(defaultParklandConstant({ burnType: 'thermal', age: 2 })).toBe(3);
  });
  it('avisa si la constante escrita sale del rango 2–4', () => {
    expect(isConstantInProtocolRange(3)).toBe(true);
    expect(isConstantInProtocolRange(1.5)).toBe(false);
    expect(isConstantInProtocolRange(5)).toBe(false);
  });
});

describe('volumen de 24 h', () => {
  it('constante × peso × %SCQ', () => {
    expect(totalVolume24h({ constant: 2, weightKg: 70, scqPercent: 30 })).toBe(4200);
    expect(totalVolume24h({ constant: 3, weightKg: 20, scqPercent: 15 })).toBe(900);
  });
});

describe('reparto con ajuste por retraso', () => {
  it('llega en la hora 0: 50 % en 8 h y 50 % en 16 h', () => {
    const s = buildInfusionSchedule(4800, 0);
    expect(s.status).toBe('on_time');
    expect(s.blocks).toHaveLength(2);
    expect(s.blocks[0]).toMatchObject({ volumeMl: 2400, durationHours: 8, rateMlPerHour: 300 });
    expect(s.blocks[1]).toMatchObject({ volumeMl: 2400, durationHours: 16, rateMlPerHour: 150 });
  });

  it('ejemplo del PDF: llega a las 3 h → el primer 50 % pasa en 5 h', () => {
    const s = buildInfusionSchedule(4800, 3);
    expect(s.status).toBe('late');
    expect(s.blocks[0]?.durationHours).toBe(5);
    expect(s.blocks[0]?.rateMlPerHour).toBe(480);
    expect(s.blocks[1]?.durationHours).toBe(16);
    expect(s.blocks[1]?.rateMlPerHour).toBe(150);
  });

  it('ya pasaron 8 h o más: 100 % del volumen en las horas restantes hasta las 24 h', () => {
    const s = buildInfusionSchedule(4800, 10);
    expect(s.blocks).toHaveLength(1);
    expect(s.blocks[0]).toMatchObject({ volumeMl: 4800, durationHours: 14 });
    expect(s.blocks[0]?.rateMlPerHour).toBeCloseTo(4800 / 14);
    const exactly8 = buildInfusionSchedule(4800, 8);
    expect(exactly8.blocks[0]?.durationHours).toBe(16);
    expect(exactly8.blocks[0]?.rateMlPerHour).toBe(300);
  });

  it('24 h o más: fuera de protocolo, sin bloques', () => {
    const s = buildInfusionSchedule(4800, 24);
    expect(s.status).toBe('beyond_24h');
    expect(s.blocks).toHaveLength(0);
    expect(s.warnings.length).toBeGreaterThan(0);
  });

  it('llegada anterior a la quemadura: inválido', () => {
    expect(buildInfusionSchedule(4800, -1).status).toBe('invalid');
  });

  it('avisa si queda menos de 1 h del bloque', () => {
    expect(buildInfusionSchedule(4800, 7.5).warnings).toHaveLength(1);
    expect(buildInfusionSchedule(4800, 23.5).warnings.length).toBeGreaterThan(0);
  });
});

describe('fluidoterapia inicial pre-cálculo', () => {
  it.each([
    [0, 125],
    [5, 125],
    [6, 250],
    [12, 250],
    [13, 500],
    [60, 500],
  ])('edad %i → %i ml/h', (age, rate) => {
    expect(initialRateMlPerHour(age)).toBe(rate);
  });
});
