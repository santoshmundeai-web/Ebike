import type { FinancialYear } from './financial-year';

/**
 * GST rules: an invoice number is at most 16 characters, unique per financial year,
 * and contains only letters, digits, hyphen and slash.
 */
export const MAX_INVOICE_NUMBER_LENGTH = 16;
const ALLOWED = /^[A-Za-z0-9/-]+$/;

export interface InvoiceNumberParts {
  /** Series prefix configured per tenant + branch + series, e.g. "SB". */
  prefix: string;
  financialYear: FinancialYear;
  /** Sequence allocated from the locked counter row, starting at 1. */
  sequence: number;
}

/** Formats { prefix: "SB", FY 2026-27, sequence: 42 } as "SB/26-27/00042". */
export function formatInvoiceNumber({
  prefix,
  financialYear,
  sequence,
}: InvoiceNumberParts): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new RangeError('sequence must be a positive integer');
  }
  const fy = financialYear.label.slice(2); // "2026-27" -> "26-27"
  const number = `${prefix}/${fy}/${String(sequence).padStart(5, '0')}`;
  if (!ALLOWED.test(number)) {
    throw new RangeError(`invoice number has invalid characters: ${number}`);
  }
  if (number.length > MAX_INVOICE_NUMBER_LENGTH) {
    throw new RangeError(`invoice number longer than ${MAX_INVOICE_NUMBER_LENGTH}: ${number}`);
  }
  return number;
}
