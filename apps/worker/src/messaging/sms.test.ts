import { createLogger } from '@ebike/shared';
import { describe, expect, it, vi } from 'vitest';
import { consoleSmsProvider, createSmsProvider, msg91SmsProvider } from './sms';

const silent = createLogger({}, () => undefined);

describe('SMS providers', () => {
  it('TC-1.3-04 MSG91: sends the OTP with template, mobile without "+" and auth key header', async () => {
    const fetchMock = vi.fn(async () => Response.json({ type: 'success' }));
    const provider = msg91SmsProvider({ authKey: 'key', otpTemplateId: 'tpl', fetch: fetchMock });
    await provider.sendOtp('+919876543210', '123456');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.searchParams.get('template_id')).toBe('tpl');
    expect(url.searchParams.get('mobile')).toBe('919876543210');
    expect(url.searchParams.get('otp')).toBe('123456');
    expect(init.headers).toMatchObject({ authkey: 'key' });
  });

  it('TC-1.3-04 MSG91: an error reply fails the job so pg-boss retries it', async () => {
    const fetchMock = vi.fn(async () => Response.json({ type: 'error', message: 'bad template' }));
    const provider = msg91SmsProvider({ authKey: 'k', otpTemplateId: 't', fetch: fetchMock });
    await expect(provider.sendOtp('+919876543210', '123456')).rejects.toThrow(/bad template/);
  });

  it('TC-1.3-13 console provider masks the phone number', async () => {
    const lines: string[] = [];
    const provider = consoleSmsProvider(createLogger({}, (l) => lines.push(l)));
    await provider.sendOtp('+919876543210', '123456');
    expect(lines[0]).toContain('******3210');
    expect(lines[0]).not.toContain('9876543210');
  });

  it('refuses to fall back to the console provider in production', () => {
    expect(() => createSmsProvider({ NODE_ENV: 'production' }, silent)).toThrow(/MSG91/);
    expect(createSmsProvider({ NODE_ENV: 'development' }, silent).name).toBe('console');
    expect(
      createSmsProvider({ MSG91_AUTH_KEY: 'k', MSG91_OTP_TEMPLATE_ID: 't' }, silent).name,
    ).toBe('msg91');
  });
});
