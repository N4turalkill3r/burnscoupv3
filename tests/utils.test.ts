import { describe, expect, it } from 'vitest';
import { formatMl, formatNumber, formatPercent, parseDecimal } from '@/shared/utils/format';
import {
  clockAfter,
  formatHours,
  hoursBetween,
  minusMinutes,
  toLocalInputValue,
} from '@/shared/utils/time';

describe('format', () => {
  it('usa coma decimal y no inventa decimales', () => {
    expect(formatNumber(12.5)).toBe('12,5');
    expect(formatNumber(12)).toBe('12');
    expect(formatPercent(18.25)).toBe('18,3 %');
    expect(formatMl(2589.6)).toBe('2590 ml');
  });

  it('parseDecimal acepta coma y punto y rechaza lo que no es número', () => {
    expect(parseDecimal('7,5')).toBe(7.5);
    expect(parseDecimal(' 7.5 ')).toBe(7.5);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
  });
});

describe('time', () => {
  it('calcula las horas entre dos valores datetime-local', () => {
    expect(hoursBetween('2026-10-08T10:00', '2026-10-08T13:30')).toBe(3.5);
    expect(hoursBetween('2026-10-08T23:00', '2026-10-09T01:00')).toBe(2);
    expect(hoursBetween('2026-10-08T10:00', '2026-10-08T09:00')).toBe(-1);
  });

  it('devuelve null si falta alguna hora', () => {
    expect(hoursBetween('', '2026-10-08T10:00')).toBeNull();
    expect(hoursBetween('2026-10-08T10:00', '')).toBeNull();
  });

  it('resta minutos y suma horas respetando el cambio de día', () => {
    expect(minusMinutes('2026-10-08T00:30', 60)).toBe('2026-10-07T23:30');
    expect(clockAfter('2026-10-08T22:00', 3)).toBe('09/10 01:00');
    expect(clockAfter('', 3)).toBe('');
  });

  it('toLocalInputValue produce el formato del campo', () => {
    expect(toLocalInputValue(new Date(2026, 9, 8, 7, 5))).toBe('2026-10-08T07:05');
  });

  it('formatea horas legibles', () => {
    expect(formatHours(3.25)).toBe('3 h 15 min');
    expect(formatHours(5)).toBe('5 h');
    expect(formatHours(0.5)).toBe('30 min');
  });
});
