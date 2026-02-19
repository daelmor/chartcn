import type { FastifyPluginAsync } from "fastify";
import { renderParamsSchema, renderQuerySchema } from "../schemas/api.js";
import { renderChart } from "../renderer/index.js";
import { hashConfig } from "../utils/hash.js";
import type { LRUCache } from "lru-cache";
import type { CachedImage, SavedConfig } from "../cache/lru-cache.js";

interface RenderRouteOptions {
  configStore: LRUCache<string, SavedConfig>;
  imageCache: LRUCache<string, CachedImage>;
}

export const chartRenderRoute: FastifyPluginAsync<RenderRouteOptions> = async (
  fastify,
  opts
) => {
  const { configStore, imageCache } = opts;

  fastify.get("/chart/render/:id", async (request, reply) => {
    const params = renderParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: "Invalid chart ID",
      });
    }

    const saved = configStore.get(params.data.id);
    if (!saved) {
      return reply.status(404).send({
        error: "Not Found",
        message: `Chart config with id "${params.data.id}" not found or expired`,
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

    const result = await renderChart(chartRequest);
    imageCache.set(cacheKey, result);

    return reply
      .header("Content-Type", result.contentType)
      .header("ETag", cacheKey)
      .header("Cache-Control", "public, max-age=3600")
      .header("X-Cache", "MISS")
      .send(result.data);
  });
};
