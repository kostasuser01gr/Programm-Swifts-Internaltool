import { z } from 'zod';

// ─── Auth Schemas ───────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name too long')
    .trim(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Workspace Schemas ──────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(10).optional().default('📁'),
  color: z.string().max(20).optional().default('#6366f1'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

// ─── Table Schemas ──────────────────────────────────────────

export const createTableSchema = z.object({
  base_id: z.string().min(1, 'Base ID is required'),
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(500).nullable().optional(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;

// ─── Record Schemas ─────────────────────────────────────────

export const createRecordSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export const updateRecordSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;

// ─── Field Schemas ──────────────────────────────────────────

export const fieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'checkbox',
  'select',
  'multi_select',
  'user',
]);

export const createFieldSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: fieldTypeSchema,
  options: z.string().nullable().optional(),
  required: z.boolean().optional().default(false),
  description: z.string().max(500).nullable().optional(),
});

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
