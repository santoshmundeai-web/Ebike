import { assertPaise, divRoundHalfUp, roundToRupee, type Paise } from './money';

/**
 * GST rate in basis points: 500 = 5 %, 1800 = 18 %, 2800 = 28 %.
 * Stored on each line at the time of sale because rates change.
 *
 * NOTE: rules here must be confirmed with the CA before changing them (CLAUDE.md section 5).
 */
export type GstRateBp = number;

export type SupplyType = 'intra_state' | 'inter_state';

export interface GstLineInput {
  hsnSac: string;
  /** Taxable value of the line in paise (after discount, before tax). */
  taxableValue: Paise;
  rateBp: GstRateBp;
}

export interface GstLine extends GstLineInput {
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  total: Paise;
}

export interface GstInvoiceTotals {
  lines: GstLine[];
  taxableValue: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  /** Sum of line totals before rounding to the rupee. */
  grossTotal: Paise;
  /** Explicit round-off line (may be negative). */
  roundOff: Paise;
  grandTotal: Paise;
}

export const GST_RATES_BP: readonly GstRateBp[] = [0, 25, 300, 500, 1200, 1800, 2800, 4000];
const VALID_RATES_BP = new Set(GST_RATES_BP);

const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** The first two digits of a GSTIN are the state code. */
export function stateCodeFromGstin(gstin: string): string {
  if (!GSTIN_PATTERN.test(gstin)) throw new RangeError('invalid GSTIN format');
  return gstin.slice(0, 2);
}

/** Intra-state when the supplier's state equals the place of supply, otherwise inter-state. */
export function supplyTypeFor(
  supplierStateCode: string,
  placeOfSupplyStateCode: string,
): SupplyType {
  return supplierStateCode === placeOfSupplyStateCode ? 'intra_state' : 'inter_state';
}

function assertRate(rateBp: number): void {
  if (!VALID_RATES_BP.has(rateBp)) throw new RangeError(`unsupported GST rate: ${rateBp} bp`);
}

/**
 * Tax for one line, rounded to paise per line.
 * Intra-state: CGST and SGST are each half the rate, each rounded separately (so they are equal).
 */
export function computeGstLine(input: GstLineInput, supplyType: SupplyType): GstLine {
  assertPaise(input.taxableValue, 'taxableValue');
  assertRate(input.rateBp);
  const taxable = BigInt(input.taxableValue);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (supplyType === 'intra_state') {
    cgst = sgst = Number(divRoundHalfUp(taxable * BigInt(input.rateBp), 20_000n));
  } else {
    igst = Number(divRoundHalfUp(taxable * BigInt(input.rateBp), 10_000n));
  }
  return { ...input, cgst, sgst, igst, total: input.taxableValue + cgst + sgst + igst };
}

/** Compute per line, round to paise, then total; round-off to the nearest rupee is explicit. */
export function computeGstInvoice(lines: GstLineInput[], supplyType: SupplyType): GstInvoiceTotals {
  const computed = lines.map((line) => computeGstLine(line, supplyType));
  const sum = (pick: (l: GstLine) => Paise) => computed.reduce((acc, l) => acc + pick(l), 0);
  const grossTotal = sum((l) => l.total);
  const { rounded, roundOff } = roundToRupee(grossTotal);
  return {
    lines: computed,
    taxableValue: sum((l) => l.taxableValue),
    cgst: sum((l) => l.cgst),
    sgst: sum((l) => l.sgst),
    igst: sum((l) => l.igst),
    grossTotal,
    roundOff,
    grandTotal: rounded,
  };
}

/**
 * Back-calculate the taxable value from a tax-inclusive price (e.g. an ex-showroom price
 * quoted with GST). Rounded to paise; recomputing tax on it may differ from the inclusive
 * price by a paisa, which the invoice round-off absorbs. Confirm with the CA.
 */
export function taxableFromInclusive(inclusive: Paise, rateBp: GstRateBp): Paise {
  assertPaise(inclusive, 'inclusive');
  assertRate(rateBp);
  return Number(divRoundHalfUp(BigInt(inclusive) * 10_000n, 10_000n + BigInt(rateBp)));
}
