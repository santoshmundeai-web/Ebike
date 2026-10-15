import { describe, expect, it } from 'vitest';
import { createLogger, maskPhone, redact } from './log';

describe('redact', () => {
  it('TC-1.3-13 masks phone numbers in common formats', () => {
    expect(redact('call +91 98765 43210 now')).toBe('call ******3210 now');
    expect(redact('mobile 9876543210')).toBe('mobile ******3210');
  });

  it('TC-1.11-05 removes Aadhaar, PAN and email', () => {
    expect(redact('aadhaar 1234 5678 9012')).toBe('aadhaar [id]');
    expect(redact('aadhaar 987654321098')).toBe('aadhaar [id]');
    expect(redact('pan ABCDE1234F')).toBe('pan [id]');
    expect(redact('mail ravi.k@example.com')).toBe('mail [email]');
  });
});

describe('maskPhone', () => {
  it('keeps only the last four digits', () => {
    expect(maskPhone('+919876543210')).toBe('******3210');
  });
});

describe('createLogger', () => {
  it('writes JSON lines with nested fields redacted', () => {
    const lines: string[] = [];
    const log = createLogger({ service: 'test' }, (l) => lines.push(l)).child({ tenantId: 't1' });
    log.info('sent to 9876543210', { customer: { phone: '+919876543210' } });
    const entry = JSON.parse(lines[0]!);
    expect(entry).toMatchObject({
      level: 'info',
      msg: 'sent to ******3210',
      service: 'test',
      tenantId: 't1',
      customer: { phone: '******3210' },
    });
  });
});
