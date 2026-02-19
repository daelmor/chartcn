import type { FastifyPluginAsync } from "fastify";
import { chartRequestSchema } from "../schemas/chart-config.js";
import { nanoid } from "nanoid";
import type { LRUCache } from "lru-cache";
import type { SavedConfig } from "../cache/lru-cache.js";

interface SaveRouteOptions {
  configStore: LRUCache<string, SavedConfig>;
  ttlSeconds: number;
}

export const chartSaveRoute: FastifyPluginAsync<SaveRouteOptions> = async (
  fastify,
  opts
) => {
  const { configStore, ttlSeconds } = opts;

  fastify.post("/chart/save", async (request, reply) => {
    const parsed = chartRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: parsed.error.issues[0].message,
        details: parsed.error.issues,
      });
    }

    const id = nanoid(10);
    const now = Date.now();

    configStore.set(id, {
      request: parsed.data,
      createdAt: now,
    });

    const expiresAt = new Date(now + ttlSeconds * 1000).toISOString();

    return reply.status(201).send({
      id,
      url: `/chart/render/${id}`,
      expiresAt,
    });
  });
};
