import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import hi from '../../messages/hi.json';

function keys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('message files (NFR-10)', () => {
  it('Hindi has exactly the same keys as English', () => {
    expect(keys(hi).sort()).toEqual(keys(en).sort());
  });

  it('no message is empty', () => {
    const empty = (m: unknown) =>
      keys(m).filter((k) => {
        const v = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], m);
        return typeof v === 'string' && v.trim() === '';
      });
    expect(empty(en)).toEqual([]);
    expect(empty(hi)).toEqual([]);
  });
});
