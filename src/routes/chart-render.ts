import type { FastifyPluginAsync } from "fastify";
import { renderParamsSchema, renderQuerySchema } from "../schemas/api.js";
import { renderChart } from "../renderer/index.js";
import { hashConfig } from "../utils/hash.js";
import { imageKey } from "../storage/image-key.js";
import type { LRUCache } from "lru-cache";
import type { CachedImage, SavedConfig } from "../cache/lru-cache.js";
import type { BlobStore } from "../storage/blob-store.js";

interface RenderRouteOptions {
  configStore: LRUCache<string, SavedConfig>;
  imageCache: LRUCache<string, CachedImage>;
  blobStore?: BlobStore;
}

export const chartRenderRoute: FastifyPluginAsync<RenderRouteOptions> = async (
  fastify,
  opts
) => {
  const { configStore, imageCache, blobStore } = opts;

  fastify.get("/chart/render/:id", async (request, reply) => {
    const params = renderParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: "Invalid chart ID",
      });
    }

    const chartId = params.data.id;

    // L1 lookup
    let saved = configStore.get(chartId);

    // L2 fallback
    if (!saved && blobStore) {
      const config = await blobStore.getConfig(chartId);
      if (config) {
        saved = { request: config, createdAt: Date.now() };
        // Populate L1
        configStore.set(chartId, saved);
      }
    }

    if (!saved) {
      return reply.status(404).send({
        error: "Not Found",
        message: `Chart config with id "${chartId}" not found or expired`,
      });
    }

    const query = renderQuerySchema.safeParse(request.query);
    const overrides = query.success ? query.data : {};

    // Apply overrides from query params
    const chartRequest = {
      ...saved.request,
      ...(overrides.format && { format: overrides.format }),
      ...(overrides.width && { width: overrides.width }),
      ...(overrides.height && { height: overrides.height }),
    };

    // L1 image cache check
    const cacheKey = hashConfig(chartRequest);
    const cached = imageCache.get(cacheKey);
    if (cached) {
      return reply
        .header("Content-Type", cached.contentType)
        .header("ETag", cacheKey)
        .header("Cache-Control", "public, max-age=3600")
        .header("X-Cache", "HIT")
        .send(cached.data);
    }

    // L2 image check
    const imgKey = imageKey(chartRequest.width, chartRequest.height, chartRequest.format);
    if (blobStore) {
      const blobImage = await blobStore.getImage(chartId, imgKey);
      if (blobImage) {
        // Populate L1
        imageCache.set(cacheKey, blobImage);
        return reply
          .header("Content-Type", blobImage.contentType)
          .header("ETag", cacheKey)
          .header("Cache-Control", "public, max-age=3600")
          .header("X-Cache", "HIT-L2")
          .send(blobImage.data);
      }
    }

    const result = await renderChart(chartRequest);
    imageCache.set(cacheKey, result);

    // Fire-and-forget write to blob storage
    if (blobStore) {
      blobStore.saveImage(chartId, imgKey, result.data, result.contentType).catch((err) => {
        fastify.log.error({ err, chartId }, "Failed to persist image to blob storage");
      });
    }

    return reply
      .header("Content-Type", result.contentType)
      .header("ETag", cacheKey)
      .header("Cache-Control", "public, max-age=3600")
      .header("X-Cache", "MISS")
      .send(result.data);
  });
};
