import { createHash } from "node:crypto";

export function hashConfig(config: unknown): string {
  const json = JSON.stringify(config);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}
