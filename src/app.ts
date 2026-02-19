import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { AppConfig } from "./config.js";
import { createImageCache, createConfigStore } from "./cache/lru-cache.js";
import { healthRoute } from "./routes/health.js";
import { chartRoute } from "./routes/chart.js";
import { chartSaveRoute } from "./routes/chart-save.js";
import { chartRenderRoute } from "./routes/chart-render.js";
import { previewRoute } from "./routes/preview.js";
import { initRenderer, shutdownRenderer } from "./renderer/index.js";

export async function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  // CORS
  await app.register(cors, {
    origin: true,
  });

  // Rate limiting
  if (config.RATE_LIMIT_RPM > 0) {
    await app.register(rateLimit, {
      max: config.RATE_LIMIT_RPM,
      timeWindow: "1 minute",
    });
  }

  // Create caches
  const imageCache = createImageCache(config.CACHE_MAX_SIZE, config.CACHE_TTL_SECONDS);
  const configStore = createConfigStore(config.CACHE_MAX_SIZE, config.CACHE_TTL_SECONDS);

  // Initialize renderer
  await initRenderer(config);

  // Register routes
  await app.register(healthRoute);
  await app.register(chartRoute, { imageCache });
  await app.register(chartSaveRoute, {
    configStore,
    ttlSeconds: config.CACHE_TTL_SECONDS,
  });
  await app.register(chartRenderRoute, { configStore, imageCache });
  await app.register(previewRoute);

  // Global error handler
  app.setErrorHandler((error: Error & { validation?: unknown }, _request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: "Validation Error",
        message: error.message,
      });
    }

    return reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred while rendering the chart",
    });
  });

  // Graceful shutdown
  app.addHook("onClose", async () => {
    await shutdownRenderer();
  });

  return app;
}
