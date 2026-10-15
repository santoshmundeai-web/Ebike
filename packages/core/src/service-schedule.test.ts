import { describe, it } from 'vitest';

// Task 1.21 (SRV-07). Specification for free-service due rules; dates are India business dates.
// Example schedule: 1st at 500 km or 1 month, 2nd at 2,500 km or 4 months, 3rd at 5,000 km or 8 months.
describe('free-service schedule', () => {
  describe('TC-1.21-02 due date', () => {
    it.todo('TC-1.21-02 sold 15 Oct 2026, 1st service due by 15 Nov 2026 or at 500 km');
    it.todo('TC-1.21-02 due when the km is reached before the date (whichever comes first)');
    it.todo('TC-1.21-02 due when the date is reached before the km');
    it.todo('TC-1.21-02 intervals are counted from the sale date, not from the previous service');
  });

  describe('TC-1.21-03 next service', () => {
    it.todo('TC-1.21-03 after the 1st free service is done, the 2nd becomes the next due');
    it.todo('TC-1.21-03 after the last free service, nothing free is due');
  });

  describe('TC-1.21-04 missed services', () => {
    it.todo('TC-1.21-04 a free service past its window (grace period per dealer) is marked missed');
    it.todo('TC-1.21-04 a missed service does not block the following ones');
  });
});
