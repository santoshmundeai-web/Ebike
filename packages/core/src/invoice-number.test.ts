import { describe, expect, it } from 'vitest';
import { formatInvoiceNumber } from './invoice-number';

const fy = { startYear: 2026, label: '2026-27' };

describe('formatInvoiceNumber', () => {
  it('TC-1.13-08 formats prefix, FY and zero-padded sequence', () => {
    expect(formatInvoiceNumber({ prefix: 'SB', financialYear: fy, sequence: 42 })).toBe(
      'SB/26-27/00042',
    );
  });

  it('TC-1.13-08 / TC-1.4-05 rejects numbers longer than 16 characters (GST rule)', () => {
    expect(() => formatInvoiceNumber({ prefix: 'SALESB', financialYear: fy, sequence: 1 })).toThrow(
      RangeError,
    );
  });

  it('TC-1.4-05 rejects characters other than letters, digits, hyphen and slash', () => {
    expect(() => formatInvoiceNumber({ prefix: 'S B', financialYear: fy, sequence: 1 })).toThrow(
      RangeError,
    );
  });

  it('rejects non-positive sequences', () => {
    expect(() => formatInvoiceNumber({ prefix: 'SB', financialYear: fy, sequence: 0 })).toThrow(
      RangeError,
    );
  });
});
