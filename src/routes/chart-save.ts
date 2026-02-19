import type { FastifyPluginAsync } from "fastify";
import { chartRequestSchema } from "../schemas/chart-config.js";
import { customAlphabet } from "nanoid";
import type { LRUCache } from "lru-cache";
import type { SavedConfig } from "../cache/lru-cache.js";
import type { BlobStore } from "../storage/blob-store.js";

const generateId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  14
);

interface SaveRouteOptions {
  configStore: LRUCache<string, SavedConfig>;
  ttlSeconds: number;
  blobStore?: BlobStore;
}

export const chartSaveRoute: FastifyPluginAsync<SaveRouteOptions> = async (
  fastify,
  opts
) => {
  const { configStore, ttlSeconds, blobStore } = opts;

  fastify.post("/chart/save", async (request, reply) => {
    const parsed = chartRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: parsed.error.issues[0].message,
        details: parsed.error.issues,
      });
    }

    const id = generateId();
    const now = Date.now();

    configStore.set(id, {
      request: parsed.data,
      createdAt: now,
    });

    // Fire-and-forget write to blob storage
    if (blobStore) {
      blobStore.saveConfig(id, parsed.data).catch((err) => {
        fastify.log.error({ err, chartId: id }, "Failed to persist config to blob storage");
      });
    }

    const expiresAt = blobStore
      ? undefined
      : new Date(now + ttlSeconds * 1000).toISOString();

    return reply.status(201).send({
      id,
      url: `/chart/render/${id}`,
      ...(expiresAt && { expiresAt }),
    });
  });
};
