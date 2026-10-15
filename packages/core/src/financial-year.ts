/** Business dates are in Asia/Kolkata; India's financial year runs 1 April to 31 March. */
export const BUSINESS_TIME_ZONE = 'Asia/Kolkata';

export interface BusinessDate {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
}

const businessDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar date of a UTC instant as seen in Asia/Kolkata. */
export function businessDate(instant: Date): BusinessDate {
  const parts = businessDateFormat.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** ISO date string (YYYY-MM-DD) of the business date. */
export function businessDateIso(instant: Date): string {
  const { year, month, day } = businessDate(instant);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface FinancialYear {
  /** Calendar year in which the FY starts, e.g. 2026 for FY 2026-27. */
  startYear: number;
  /** Label used in invoice series, e.g. "2026-27". */
  label: string;
}

export function financialYearOf(instant: Date): FinancialYear {
  const { year, month } = businessDate(instant);
  const startYear = month >= 4 ? year : year - 1;
  return { startYear, label: `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}` };
}
