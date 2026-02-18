import { z } from "zod";

// ── Health Response ─────────────────────────────────────────
export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  version: z.string(),
  timestamp: z.string(),
  environment: z.string().optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ── Audit Log ───────────────────────────────────────────────
export const AuditEntrySchema = z.object({
  action: z
    .string()
    .min(1, "action is required")
    .max(255, "action too long"),
  actor: z
    .string()
    .min(1, "actor is required")
    .max(255, "actor too long"),
  resource: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const AuditResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
  timestamp: z.string(),
});

export type AuditResponse = z.infer<typeof AuditResponseSchema>;

// ── Generic API Envelope ────────────────────────────────────
export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
