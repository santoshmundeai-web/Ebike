import { describe, it } from 'vitest';

// Task 1.13 (SAL-04). Specification for gap-free invoice numbering in the database.
// Numbers are allocated from a locked counter row in the same transaction as the invoice insert.
describe('invoice numbering', () => {
  it.todo('TC-1.13-09 numbers are 1, 2, 3 ... with no gaps per tenant + branch + series + FY');
  it.todo('TC-1.13-10 20 concurrent invoices get 20 unique, consecutive numbers');
  it.todo('TC-1.13-11 an invoice whose transaction rolls back does not use up a number');
  it.todo('TC-1.13-12 the first invoice dated 1 April (India time) starts again at 1');
  it.todo('TC-1.13-13 two branches of one tenant have independent sequences');
  it.todo('TC-1.13-13 two tenants with the same prefix have independent sequences');
  it.todo('TC-1.13-14 an issued invoice cannot be updated or deleted by the app role');
});
