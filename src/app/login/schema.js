import { z } from 'zod';

export const emailSchema = z.object({ email: z.string().trim().min(1, 'An email is required.').email('That does not look like an email.') });
export const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, 'The code is six digits.') });
