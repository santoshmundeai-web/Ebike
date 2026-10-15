import { z } from 'zod';

/** Indian mobile number, normalised to E.164 (+91XXXXXXXXXX). */
export const indianMobileSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'invalid_mobile'))
  .transform((digits) => `+91${digits}`);

export const gstinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'invalid_gstin');

/** Two-digit GST state code, e.g. "27" for Maharashtra. */
export const stateCodeSchema = z.string().regex(/^\d{2}$/, 'invalid_state_code');

/** Vehicle chassis number (VIN). Indian VINs are 17 characters; older stock may differ. */
export const chassisNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{6,17}$/, 'invalid_chassis_number');

/** Integer paise. */
export const paiseSchema = z.number().int().refine(Number.isSafeInteger, 'invalid_amount');

/** Cursor pagination query used by every list endpoint under /api/v1. */
export const cursorPageQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type CursorPageQuery = z.infer<typeof cursorPageQuerySchema>;

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
