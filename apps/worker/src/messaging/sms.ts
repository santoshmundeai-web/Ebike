import { maskPhone, type Logger } from '@ebike/shared';

/**
 * All SMS sends go through this module (CLAUDE.md section 5). Providers are swappable so the
 * rest of the worker never talks to MSG91 directly.
 */
export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneNumber: string, code: string): Promise<void>;
}

/** Development only: prints the OTP so you can log in locally without an SMS account. */
export function consoleSmsProvider(log: Logger): SmsProvider {
  return {
    name: 'console',
    async sendOtp(phoneNumber, code) {
      // The logger masks phone numbers; the code is shown on purpose (dev only).
      log.info(`DEV OTP for ${maskPhone(phoneNumber)}: ${code}`);
    },
  };
}

export interface Msg91Config {
  authKey: string;
  otpTemplateId: string;
  fetch?: typeof fetch;
}

/**
 * MSG91 OTP API (DLT-registered template). Docs: https://docs.msg91.com/otp
 * Needs a live check with the real account before go-live (task 1.22).
 */
export function msg91SmsProvider(config: Msg91Config): SmsProvider {
  const doFetch = config.fetch ?? fetch;
  return {
    name: 'msg91',
    async sendOtp(phoneNumber, code) {
      const url = new URL('https://control.msg91.com/api/v5/otp');
      url.searchParams.set('template_id', config.otpTemplateId);
      url.searchParams.set('mobile', phoneNumber.replace(/^\+/, ''));
      url.searchParams.set('otp', code);
      const response = await doFetch(url, {
        method: 'POST',
        headers: { authkey: config.authKey, 'content-type': 'application/json' },
      });
      const body = (await response.json().catch(() => ({}))) as { type?: string; message?: string };
      if (!response.ok || body.type === 'error') {
        throw new Error(`MSG91 OTP send failed: ${response.status} ${body.message ?? ''}`.trim());
      }
    },
  };
}

export function createSmsProvider(
  env: { NODE_ENV?: string; MSG91_AUTH_KEY?: string; MSG91_OTP_TEMPLATE_ID?: string },
  log: Logger,
): SmsProvider {
  if (env.MSG91_AUTH_KEY && env.MSG91_OTP_TEMPLATE_ID) {
    return msg91SmsProvider({
      authKey: env.MSG91_AUTH_KEY,
      otpTemplateId: env.MSG91_OTP_TEMPLATE_ID,
    });
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID must be set in production');
  }
  return consoleSmsProvider(log);
}
