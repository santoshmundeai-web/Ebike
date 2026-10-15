import { ROLES } from '@ebike/core';
import { z } from 'zod';
import { indianMobileSchema } from './schemas';

/** Owner adds a staff user (STF-01). Used by the form and by the server. */
export const newStaffSchema = z.object({
  name: z.string().trim().min(2, 'name_too_short').max(100),
  /** Optional: many showroom staff sign in with phone + OTP only. */
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('invalid_email')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phoneNumber: indianMobileSchema,
  role: z.enum(ROLES),
  branchIds: z.array(z.string().uuid()).min(1, 'branch_required'),
  /** Optional initial password; without one the user signs in with OTP. */
  password: z
    .string()
    .min(8, 'password_too_short')
    .max(128)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
export type NewStaff = z.input<typeof newStaffSchema>;
export type NewStaffParsed = z.output<typeof newStaffSchema>;
