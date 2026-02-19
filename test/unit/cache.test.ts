import { describe, it, expect } from "vitest";
import { createImageCache, createConfigStore } from "../../src/cache/lru-cache.js";
import { hashConfig } from "../../src/utils/hash.js";

describe("image cache", () => {
  it("stores and retrieves cached images", () => {
    const cache = createImageCache(10, 3600);
    const data = Buffer.from("test-image-data");

    cache.set("key1", { data, contentType: "image/png" });

    const result = cache.get("key1");
    expect(result).toBeDefined();
    expect(result!.data.toString()).toBe("test-image-data");
    expect(result!.contentType).toBe("image/png");
  });

  it("returns undefined for missing keys", () => {
    const cache = createImageCache(10, 3600);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts entries when max size exceeded", () => {
    const cache = createImageCache(2, 3600);

    cache.set("a", { data: Buffer.from("a"), contentType: "image/png" });
    cache.set("b", { data: Buffer.from("b"), contentType: "image/png" });
    cache.set("c", { data: Buffer.from("c"), contentType: "image/png" });

    // 'a' should have been evicted (LRU)
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBeDefined();
  });
});

describe("config store", () => {
  it("stores and retrieves saved configs", () => {
    const store = createConfigStore(10, 3600);
    const request = {
      type: "bar" as const,
      width: 600,
      height: 400,
      format: "png" as const,
      theme: "default" as const,
      config: { data: [{ x: 1 }] },
    };

    store.set("id1", { request, createdAt: Date.now() });

    const result = store.get("id1");
    expect(result).toBeDefined();
    expect(result!.request.type).toBe("bar");
  });
});

describe("hashConfig", () => {
  it("produces consistent hashes for same config", () => {
    const config = { type: "bar", data: [1, 2, 3] };
    const h1 = hashConfig(config);
    const h2 = hashConfig(config);
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different configs", () => {
    const h1 = hashConfig({ type: "bar" });
    const h2 = hashConfig({ type: "line" });
    expect(h1).not.toBe(h2);
  });

  it("returns a 16-character hex string", () => {
    const h = hashConfig({ test: true });
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });
});
