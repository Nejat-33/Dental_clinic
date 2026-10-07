// src/lib/phone.ts
import { z } from 'zod';

// Accepts 09xxxxxxxx, 07xxxxxxxx, 2519xxxxxxxx, +2519xxxxxxxx; stores as +251XXXXXXXXX
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(?:\+251|251|0)?[79]\d{8}$/, 'Invalid Ethiopian mobile number'))
  .transform((v) => '+251' + v.slice(-9));