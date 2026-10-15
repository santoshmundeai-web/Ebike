import { describe, expect, it } from 'vitest';
import { businessDateIso, financialYearOf } from './financial-year';

describe('businessDateIso', () => {
  it('TC-1.13-18 uses the Asia/Kolkata calendar date, not UTC', () => {
    // 19:00 UTC on 14 Oct is 00:30 IST on 15 Oct
    expect(businessDateIso(new Date('2026-10-14T19:00:00Z'))).toBe('2026-10-15');
    expect(businessDateIso(new Date('2026-10-14T18:29:59Z'))).toBe('2026-10-14');
  });
});

describe('financialYearOf', () => {
  it('TC-1.13-07 switches FY at midnight IST on 1 April', () => {
    // 23:59:59 IST on 31 March
    expect(financialYearOf(new Date('2026-03-31T18:29:59Z')).label).toBe('2025-26');
    // 00:00 IST on 1 April (still 31 March in UTC)
    expect(financialYearOf(new Date('2026-03-31T18:30:00Z')).label).toBe('2026-27');
  });

  it('TC-1.13-07 handles January to March as the previous start year', () => {
    expect(financialYearOf(new Date('2027-02-10T06:00:00Z'))).toEqual({
      startYear: 2026,
      label: '2026-27',
    });
  });

  it('formats the century rollover', () => {
    expect(financialYearOf(new Date('2099-06-01T00:00:00Z')).label).toBe('2099-00');
  });
});
