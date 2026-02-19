import { pino } from "fastify/pino";

export function createLogger(level: string) {
  return pino({ level });
}
