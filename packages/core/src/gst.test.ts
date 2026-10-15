import { describe, expect, it } from 'vitest';
import {
  computeGstInvoice,
  computeGstLine,
  stateCodeFromGstin,
  supplyTypeFor,
  taxableFromInclusive,
} from './gst';

describe('supply type', () => {
  it('TC-1.4-02 reads the state code from a GSTIN', () => {
    expect(stateCodeFromGstin('27AAPFU0939F1ZV')).toBe('27');
    expect(() => stateCodeFromGstin('27AAPFU0939F1Z')).toThrow(RangeError);
  });

  it('TC-1.13-06 is intra-state only when supplier state equals place of supply', () => {
    expect(supplyTypeFor('27', '27')).toBe('intra_state');
    expect(supplyTypeFor('27', '29')).toBe('inter_state');
  });
});

describe('computeGstLine', () => {
  it('TC-1.13-01 splits intra-state tax into equal CGST and SGST', () => {
    const line = computeGstLine(
      { hsnSac: '87116020', taxableValue: 100_000, rateBp: 500 },
      'intra_state',
    );
    expect(line).toMatchObject({ cgst: 2500, sgst: 2500, igst: 0, total: 105_000 });
  });

  it('TC-1.13-02 charges IGST only for inter-state supply', () => {
    const line = computeGstLine(
      { hsnSac: '87116020', taxableValue: 100_000, rateBp: 500 },
      'inter_state',
    );
    expect(line).toMatchObject({ cgst: 0, sgst: 0, igst: 5000, total: 105_000 });
  });

  it('TC-1.13-01 rounds each half to paise separately', () => {
    // 333 paise x 9 % = 29.97 -> 30 each; IGST 333 x 18 % = 59.94 -> 60
    const intra = computeGstLine(
      { hsnSac: '8714', taxableValue: 333, rateBp: 1800 },
      'intra_state',
    );
    expect(intra).toMatchObject({ cgst: 30, sgst: 30, total: 393 });
    const inter = computeGstLine(
      { hsnSac: '8714', taxableValue: 333, rateBp: 1800 },
      'inter_state',
    );
    expect(inter).toMatchObject({ igst: 60, total: 393 });
  });

  it('TC-1.6-03 rejects unknown rates and fractional paise', () => {
    expect(() =>
      computeGstLine({ hsnSac: '8714', taxableValue: 100, rateBp: 1700 }, 'intra_state'),
    ).toThrow(RangeError);
    expect(() =>
      computeGstLine({ hsnSac: '8714', taxableValue: 100.5, rateBp: 1800 }, 'intra_state'),
    ).toThrow(RangeError);
  });
});

describe('computeGstInvoice', () => {
  it('TC-1.13-03 rounds per line, totals, then adds an explicit rupee round-off', () => {
    // 84747 x 9 % = 7627.23 -> 7627 each; gross 100001 -> 100000, round-off -1
    const totals = computeGstInvoice(
      [{ hsnSac: '8714', taxableValue: 84_747, rateBp: 1800 }],
      'intra_state',
    );
    expect(totals).toMatchObject({
      taxableValue: 84_747,
      cgst: 7627,
      sgst: 7627,
      igst: 0,
      grossTotal: 100_001,
      roundOff: -1,
      grandTotal: 100_000,
    });
  });

  it('TC-1.13-04 sums mixed-rate lines', () => {
    const totals = computeGstInvoice(
      [
        { hsnSac: '87116020', taxableValue: 6_000_000, rateBp: 500 },
        { hsnSac: '8714', taxableValue: 150_050, rateBp: 1800 },
      ],
      'inter_state',
    );
    // 300000 + 27009 IGST
    expect(totals.igst).toBe(327_009);
    expect(totals.grossTotal).toBe(6_477_059);
    expect(totals.roundOff).toBe(41);
    expect(totals.grandTotal).toBe(6_477_100);
  });

  it('handles an empty invoice', () => {
    expect(computeGstInvoice([], 'intra_state').grandTotal).toBe(0);
  });
});

describe('taxableFromInclusive', () => {
  it('TC-1.13-05 back-calculates the taxable value', () => {
    expect(taxableFromInclusive(105_000, 500)).toBe(100_000);
    // 69,999.00 incl. 5 % -> 66,665.71
    expect(taxableFromInclusive(6_999_900, 500)).toBe(6_666_571);
  });
});
