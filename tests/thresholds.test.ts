import { describe, expect, it } from 'vitest';
import { exceedsScqThreshold, scqThresholdForAge } from '@/features/burn-calculation/thresholds';

describe('umbrales de SCQ por edad', () => {
  it.each([
    [0, 5],
    [2, 5],
    [3, 10], // menores de 3 no incluye 3
    [10, 10], // 3 a 10 incluye 10
    [11, 15], // 10 a 14 no incluye 10
    [14, 15],
    [15, 20], // adultos > 14
    [64, 20],
    [65, 10], // adultos mayores ≥ 65
    [90, 10],
  ])('edad %i → umbral %i %%', (age, expected) => {
    expect(scqThresholdForAge(age).thresholdPercent).toBe(expected);
  });

  it('"supera" es estrictamente mayor que el umbral', () => {
    expect(exceedsScqThreshold(20, 30)).toBe(false);
    expect(exceedsScqThreshold(20.5, 30)).toBe(true);
    expect(exceedsScqThreshold(5, 1)).toBe(false);
    expect(exceedsScqThreshold(5.1, 1)).toBe(true);
    expect(exceedsScqThreshold(10.5, 70)).toBe(true);
  });
});
