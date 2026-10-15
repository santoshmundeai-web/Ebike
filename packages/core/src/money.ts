/**
 * Money is an integer number of paise. Never use floats for money.
 *
 * We use `number` (not `bigint`) in TypeScript so values serialise to JSON cleanly; every
 * amount is checked to be a safe integer (up to ~9e13 rupees, far beyond any invoice).
 * The database column type is still Postgres `bigint`. See docs/adr/002-money-as-integer-paise.md.
 */
export type Paise = number;

export function assertPaise(value: number, label = 'amount'): asserts value is Paise {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be an integer number of paise, got ${value}`);
  }
}

/** Divide two integers and round half away from zero (commercial rounding). */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError('denominator must be positive');
  const negative = numerator < 0n;
  const abs = negative ? -numerator : numerator;
  const q = (abs * 2n + denominator) / (denominator * 2n);
  return negative ? -q : q;
}

/** Parse a rupee string like "1,23,456.78" into paise without going through floats. */
export function rupeesToPaise(rupees: string): Paise {
  const cleaned = rupees.replace(/[,\s₹]/g, '');
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) throw new RangeError(`not a rupee amount: ${rupees}`);
  const [, sign, whole = '0', fraction = ''] = match;
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  const result = sign ? -paise : paise;
  assertPaise(result);
  return result;
}

/** Round to the nearest rupee; returns the rounded total and the explicit round-off line. */
export function roundToRupee(total: Paise): { rounded: Paise; roundOff: Paise } {
  assertPaise(total, 'total');
  const rounded = Number(divRoundHalfUp(BigInt(total), 100n) * 100n);
  return { rounded, roundOff: rounded - total };
}

/** Format paise as Indian rupees for display only, e.g. 12345678 -> "₹1,23,456.78". */
export function formatInr(paise: Paise, locale = 'en-IN'): string {
  assertPaise(paise);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}
