import { describe, expect, it } from 'vitest';
import { chassisNumberSchema, gstinSchema, indianMobileSchema } from './schemas';

describe('indianMobileSchema', () => {
  it('TC-1.11-02 / TC-1.10-05 normalises common formats to E.164', () => {
    for (const input of ['9876543210', '+91 98765 43210', '09876543210', '91-9876543210']) {
      expect(indianMobileSchema.parse(input)).toBe('+919876543210');
    }
  });

  it('TC-1.11-02 rejects numbers that cannot be Indian mobiles', () => {
    expect(indianMobileSchema.safeParse('5876543210').success).toBe(false);
    expect(indianMobileSchema.safeParse('98765').success).toBe(false);
  });
});

describe('gstinSchema', () => {
  it('TC-1.4-02 upper-cases and validates', () => {
    expect(gstinSchema.parse(' 27aapfu0939f1zv ')).toBe('27AAPFU0939F1ZV');
    expect(gstinSchema.safeParse('27AAPFU0939F1Z').success).toBe(false);
  });
});

describe('chassisNumberSchema', () => {
  it('TC-1.7-03 rejects the letters I, O and Q', () => {
    expect(chassisNumberSchema.parse('ma1ab2cd3ef456789')).toBe('MA1AB2CD3EF456789');
    expect(chassisNumberSchema.safeParse('MA1AB2CD3EF45678O').success).toBe(false);
  });
});
