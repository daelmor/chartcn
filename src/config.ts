import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  CACHE_MAX_SIZE: z.coerce.number().default(500),
  CACHE_TTL_SECONDS: z.coerce.number().default(3600),
  MAX_CONCURRENT_RENDERS: z.coerce.number().default(10),
  RENDER_TIMEOUT_MS: z.coerce.number().default(10000),
  LOG_LEVEL: z.string().default("info"),
  RATE_LIMIT_RPM: z.coerce.number().default(60),
  CHROMIUM_PATH: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  return envSchema.parse(process.env);
}
