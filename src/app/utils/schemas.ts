// ── Zod Validation Schemas ────────────────────────────────
// Shared validation for forms (React Hook Form + Zod resolver).

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const createTableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const createRecordSchema = z.record(z.string(), z.unknown());

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'el']),
  autoLogoutMinutes: z.number().min(5).max(480).optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type CreateWorkspaceForm = z.infer<typeof createWorkspaceSchema>;
export type CreateTableForm = z.infer<typeof createTableSchema>;
export type SettingsForm = z.infer<typeof settingsSchema>;
