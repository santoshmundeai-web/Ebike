import { describe, it } from 'vitest';

// Task 1.14 (SAL-05, SAL-13). Specification for invoice balance rules; all amounts in paise.
describe('invoice balance', () => {
  describe('TC-1.14-02 balance and status', () => {
    it.todo('TC-1.14-02 no payments: balance = grand total, status unpaid');
    it.todo('TC-1.14-02 Rs 20,000 paid on a Rs 69,999 invoice: balance Rs 49,999, part_paid');
    it.todo('TC-1.14-02 payments summing to the total: balance 0, status paid');
    it.todo('TC-1.14-02 credit notes reduce the balance the same way payments do');
    it.todo('TC-1.14-02 a booking advance counts as a payment against the invoice');
  });

  describe('TC-1.14-03 overpayment', () => {
    it.todo('TC-1.14-03 a payment larger than the balance due is rejected');
    it.todo('TC-1.14-03 zero or negative payment amounts are rejected');
  });

  describe('TC-1.14-06 credit note limits', () => {
    it.todo('TC-1.14-06 credit notes in total cannot exceed the invoice grand total');
    it.todo(
      'TC-1.14-06 a credit note line cannot exceed the quantity or value of its original line',
    );
    it.todo(
      'TC-1.14-06 a credit note reverses GST per line with the original rate and supply type',
    );
  });
});
