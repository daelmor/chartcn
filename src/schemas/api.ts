import { z } from "zod";
import { chartRequestSchema } from "./chart-config.js";

export const saveRequestSchema = chartRequestSchema;

export const saveResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  expiresAt: z.string(),
});

export const renderParamsSchema = z.object({
  id: z.string().min(1),
});

export const renderQuerySchema = z.object({
  format: z.enum(["png", "svg", "pdf"]).optional(),
  width: z.coerce.number().min(50).max(4096).optional(),
  height: z.coerce.number().min(50).max(4096).optional(),
});

export const healthResponseSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  renderer: z.string(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.array(z.unknown()).optional(),
});
