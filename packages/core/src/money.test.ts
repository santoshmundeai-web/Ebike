import { describe, expect, it } from 'vitest';
import { assertPaise, divRoundHalfUp, formatInr, roundToRupee, rupeesToPaise } from './money';

describe('divRoundHalfUp', () => {
  it('rounds halves away from zero', () => {
    expect(divRoundHalfUp(5n, 2n)).toBe(3n);
    expect(divRoundHalfUp(-5n, 2n)).toBe(-3n);
    expect(divRoundHalfUp(7n, 2n)).toBe(4n);
  });

  it('rounds below half down', () => {
    expect(divRoundHalfUp(4n, 3n)).toBe(1n);
    expect(divRoundHalfUp(-4n, 3n)).toBe(-1n);
  });

  it('rejects non-positive denominators', () => {
    expect(() => divRoundHalfUp(1n, 0n)).toThrow(RangeError);
  });
});

describe('assertPaise', () => {
  it('rejects fractional and unsafe values', () => {
    expect(() => assertPaise(10.5)).toThrow(RangeError);
    expect(() => assertPaise(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => assertPaise(100)).not.toThrow();
  });
});

describe('rupeesToPaise', () => {
  it('TC-1.6-02 / TC-1.10-05 parses Indian-grouped amounts without floats', () => {
    expect(rupeesToPaise('1,23,456.78')).toBe(12_345_678);
    expect(rupeesToPaise('₹ 10.5')).toBe(1050);
    expect(rupeesToPaise('0.07')).toBe(7);
    expect(rupeesToPaise('-25')).toBe(-2500);
  });

  it('rejects malformed input', () => {
    expect(() => rupeesToPaise('12.345')).toThrow(RangeError);
    expect(() => rupeesToPaise('abc')).toThrow(RangeError);
  });
});

describe('roundToRupee', () => {
  it('rounds 50 paise up and returns an explicit round-off', () => {
    expect(roundToRupee(12_350)).toEqual({ rounded: 12_400, roundOff: 50 });
  });

  it('rounds 49 paise down', () => {
    expect(roundToRupee(12_349)).toEqual({ rounded: 12_300, roundOff: -49 });
  });

  it('leaves whole rupees alone', () => {
    expect(roundToRupee(12_300)).toEqual({ rounded: 12_300, roundOff: 0 });
  });
});

describe('formatInr', () => {
  it('TC-1.15-02 uses Indian digit grouping', () => {
    expect(formatInr(12_345_678)).toBe('₹1,23,456.78');
  });
});
