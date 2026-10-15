import { describe, it } from 'vitest';

// Task 1.7 (INV-03). Specification for the unit status rules; implementation lands with the task.
// Statuses: in_transit, in_stock, booked, sold, demo.
describe('bike unit status transitions', () => {
  describe('TC-1.7-05 allowed', () => {
    it.todo('TC-1.7-05 in_transit -> in_stock (bike received from OEM)');
    it.todo('TC-1.7-05 in_stock -> booked (booking with advance)');
    it.todo('TC-1.7-05 booked -> sold (only when an invoice is issued)');
    it.todo('TC-1.7-05 in_stock -> sold (direct sale without booking, only via invoice)');
    it.todo('TC-1.7-05 booked -> in_stock (booking cancelled)');
    it.todo('TC-1.7-05 in_stock -> demo and demo -> in_stock');
    it.todo('TC-1.7-05 sold -> in_stock only through a sales return linked to a credit note');
  });

  describe('TC-1.7-06 rejected', () => {
    it.todo('TC-1.7-06 in_transit -> sold, booked or demo');
    it.todo('TC-1.7-06 sold -> in_stock without a sales return');
    it.todo('TC-1.7-06 sold -> booked or demo');
    it.todo('TC-1.7-06 demo -> booked or sold without first returning to in_stock');
    it.todo('TC-1.7-06 a transition to the same status');
  });
});
