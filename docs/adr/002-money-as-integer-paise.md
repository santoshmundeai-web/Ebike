# 002 — Money as integer paise; TypeScript `number`, Postgres `bigint`

Status: accepted (2026-10-15)

## Decision

- All amounts are integer paise. Postgres columns are `bigint`.
- In TypeScript we use `number` (not `bigint`) so values pass through JSON, Zod and React without
  custom serialisation. `assertPaise` rejects anything that is not a safe integer
  (limit about 9 x 10^13 rupees).
- Multiplications that could overflow (amount x rate) are done in `bigint` inside `packages/core`
  and converted back after rounding.
- GST rates are stored in basis points (500 = 5 %). Rounding is half away from zero, per line,
  then totals, then an explicit round-off line to the nearest rupee.

## Open questions for the CA

- Confirm half-up rounding and per-line rounding of CGST and SGST separately.
- Confirm handling of tax-inclusive (ex-showroom) prices: `taxableFromInclusive` back-calculates the
  taxable value and lets the round-off line absorb a paisa of difference.
