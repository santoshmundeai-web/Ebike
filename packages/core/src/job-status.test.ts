import { describe, it } from 'vitest';

// Task 1.17 (SRV-02). Specification for the job card status flow; implementation lands with the task.
// Statuses: open, in_progress, waiting_for_parts, ready, delivered.
describe('job card status flow', () => {
  describe('TC-1.17-02 allowed', () => {
    it.todo('TC-1.17-02 open -> in_progress (requires an assigned technician)');
    it.todo('TC-1.17-02 in_progress -> waiting_for_parts and back to in_progress');
    it.todo('TC-1.17-02 in_progress -> ready');
    it.todo('TC-1.17-02 ready -> delivered (requires a service invoice, see TC-1.19-04)');
    it.todo('TC-1.17-02 ready -> in_progress (rework found at final check)');
  });

  describe('TC-1.17-03 rejected', () => {
    it.todo('TC-1.17-03 open -> ready or delivered (skipping work)');
    it.todo('TC-1.17-03 waiting_for_parts -> ready or delivered');
    it.todo('TC-1.17-03 any change after delivered');
  });
});
