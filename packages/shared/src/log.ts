/**
 * Structured JSON logger. Personal data must never reach logs (CLAUDE.md section 5),
 * so every string is passed through `redact` before it is written.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

const PHONE = /(?<![\d+])(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;
/** Aadhaar (12 digits, optionally grouped 4-4-4). */
const AADHAAR = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const PAN = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;

/** Mask a phone number, keeping the last 4 digits: "+919876543210" -> "******3210". */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return `******${digits.slice(-4)}`;
}

export function redact(text: string): string {
  return text
    .replace(EMAIL, '[email]')
    .replace(PHONE, (match) => maskPhone(match))
    .replace(AADHAAR, '[id]')
    .replace(PAN, '[id]');
}

function redactValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return redact(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redact(value.message),
      stack: value.stack && redact(value.stack),
    };
  }
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redactValue(v, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactValue(v, depth + 1)]));
}

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  child(fields: Fields): Logger;
}

export function createLogger(
  base: Fields = {},
  write = (line: string) => console.log(line),
): Logger {
  const log = (level: Level, msg: string, fields: Fields = {}) =>
    write(
      JSON.stringify({
        time: new Date().toISOString(),
        level,
        msg: redact(msg),
        ...(redactValue({ ...base, ...fields }) as Fields),
      }),
    );
  return {
    debug: (msg, fields) => log('debug', msg, fields),
    info: (msg, fields) => log('info', msg, fields),
    warn: (msg, fields) => log('warn', msg, fields),
    error: (msg, fields) => log('error', msg, fields),
    child: (fields) => createLogger({ ...base, ...fields }, write),
  };
}
