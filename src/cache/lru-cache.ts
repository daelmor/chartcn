import { LRUCache } from "lru-cache";
import type { ChartRequest } from "../schemas/chart-config.js";

export interface CachedImage {
  data: Buffer;
  contentType: string;
}

export interface SavedConfig {
  request: ChartRequest;
  createdAt: number;
}

export function createImageCache(maxSize: number, ttlSeconds: number) {
  return new LRUCache<string, CachedImage>({
    max: maxSize,
    ttl: ttlSeconds * 1000,
  });
}

export function createConfigStore(maxSize: number, ttlSeconds: number) {
  return new LRUCache<string, SavedConfig>({
    max: maxSize,
    ttl: ttlSeconds * 1000,
  });
}
