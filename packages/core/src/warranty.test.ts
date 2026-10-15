import { describe, it } from 'vitest';

// Task 1.21 (SRV-10). Specification for per-component warranty (motor, battery, controller, charger).
// Proposed rule (confirm against OEM terms): the warranty ends the day before the anniversary
// N months after the start; if the anniversary day does not exist in that month, it ends on
// the last day of that month.
describe('component warranty', () => {
  describe('TC-1.21-05 end date', () => {
    it.todo('TC-1.21-05 battery with 36 months from 15 Oct 2026 ends on 14 Oct 2029');
    it.todo('TC-1.21-05 each component has its own warranty months');
    it.todo('TC-1.21-05 the start date is the India date of the sale, not the UTC date');
  });

  describe('TC-1.21-06 expiry boundary', () => {
    it.todo('TC-1.21-06 warranty is valid on its last day');
    it.todo('TC-1.21-06 warranty is expired from the next day');
  });

  describe('TC-1.21-07 month ends', () => {
    it.todo('TC-1.21-07 started 31 Jan 2027 with 1 month: ends 28 Feb 2027');
    it.todo('TC-1.21-07 started 29 Feb 2028 with 12 months: ends 28 Feb 2029');
  });
});
