import type { FastifyPluginAsync } from "fastify";
import { chartRequestSchema, chartQuerySchema } from "../schemas/chart-config.js";
import { renderChart } from "../renderer/index.js";
import { hashConfig } from "../utils/hash.js";
import type { LRUCache } from "lru-cache";
import type { CachedImage } from "../cache/lru-cache.js";

interface ChartRouteOptions {
  imageCache: LRUCache<string, CachedImage>;
}

export const chartRoute: FastifyPluginAsync<ChartRouteOptions> = async (
  fastify,
  opts
) => {
  const { imageCache } = opts;

  // POST /chart — full config via JSON body
  fastify.post("/chart", async (request, reply) => {
    const parsed = chartRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: parsed.error.issues[0].message,
        details: parsed.error.issues,
      });
    }

    const chartRequest = parsed.data;
    const cacheKey = hashConfig(chartRequest);

    // Check cache
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

    // Store in cache
    imageCache.set(cacheKey, result);

    return reply
      .header("Content-Type", result.contentType)
      .header("ETag", cacheKey)
      .header("Cache-Control", "public, max-age=3600")
      .header("X-Cache", "MISS")
      .send(result.data);
  });

  // GET /chart — quick usage via query params
  fastify.get("/chart", async (request, reply) => {
    const query = request.query as Record<string, string>;

    // Parse the data query param
    const parsed = chartQuerySchema.safeParse(query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: parsed.error.issues[0].message,
        details: parsed.error.issues,
      });
    }

    const { data, ...rest } = parsed.data;

    // Build a full chart request from the query data
    const chartRequest = chartRequestSchema.safeParse({
      ...rest,
      config: data,
    });

    if (!chartRequest.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: chartRequest.error.issues[0].message,
        details: chartRequest.error.issues,
      });
    }

    const cacheKey = hashConfig(chartRequest.data);

    const cached = imageCache.get(cacheKey);
    if (cached) {
      return reply
        .header("Content-Type", cached.contentType)
        .header("ETag", cacheKey)
        .header("Cache-Control", "public, max-age=3600")
        .header("X-Cache", "HIT")
        .send(cached.data);
    }

    const result = await renderChart(chartRequest.data);
    imageCache.set(cacheKey, result);

    return reply
      .header("Content-Type", result.contentType)
      .header("ETag", cacheKey)
      .header("Cache-Control", "public, max-age=3600")
      .header("X-Cache", "MISS")
      .send(result.data);
  });
};
