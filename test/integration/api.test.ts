import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { FastifyInstance } from "fastify";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let app: FastifyInstance;

beforeAll(async () => {
  process.env.LOG_LEVEL = "error";
  process.env.RATE_LIMIT_RPM = "0";
  const config = loadConfig();
  app = await buildApp(config);
}, 30000);

afterAll(async () => {
  await app.close();
}, 15000);

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.renderer).toBe("puppeteer");
    expect(typeof body.uptime).toBe("number");
  });
});

describe("POST /chart", () => {
  it("renders a bar chart as PNG", async () => {
    const fixture = JSON.parse(
      readFileSync(resolve(__dirname, "../fixtures/configs/bar-chart.json"), "utf-8")
    );

    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: fixture,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.headers["x-cache"]).toBe("MISS");
    expect(res.rawPayload.length).toBeGreaterThan(1000);
    // PNG magic bytes
    expect(res.rawPayload[0]).toBe(0x89);
    expect(res.rawPayload[1]).toBe(0x50); // P
    expect(res.rawPayload[2]).toBe(0x4e); // N
    expect(res.rawPayload[3]).toBe(0x47); // G
  }, 15000);

  it("renders an area chart", async () => {
    const fixture = JSON.parse(
      readFileSync(resolve(__dirname, "../fixtures/configs/area-chart.json"), "utf-8")
    );

    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: fixture,
    });

    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.length).toBeGreaterThan(1000);
  }, 15000);

  it("renders a line chart", async () => {
    const fixture = JSON.parse(
      readFileSync(resolve(__dirname, "../fixtures/configs/line-chart.json"), "utf-8")
    );

    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: fixture,
    });

    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.length).toBeGreaterThan(1000);
  }, 15000);

  it("renders a pie chart", async () => {
    const fixture = JSON.parse(
      readFileSync(resolve(__dirname, "../fixtures/configs/pie-chart.json"), "utf-8")
    );

    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: fixture,
    });

    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.length).toBeGreaterThan(1000);
  }, 15000);

  it("renders a radar chart", async () => {
    const fixture = JSON.parse(
      readFileSync(resolve(__dirname, "../fixtures/configs/radar-chart.json"), "utf-8")
    );

    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: fixture,
    });

    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.length).toBeGreaterThan(1000);
  }, 15000);

  it("renders a radial chart", async () => {
    const fixture = JSON.parse(
      readFileSync(resolve(__dirname, "../fixtures/configs/radial-chart.json"), "utf-8")
    );

    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: fixture,
    });

    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.length).toBeGreaterThan(1000);
  }, 15000);

  it("renders SVG format", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: {
        type: "bar",
        format: "svg",
        config: {
          data: [{ x: "A", y: 10 }, { x: "B", y: 20 }],
          xAxis: { key: "x" },
          series: [{ key: "y" }],
        },
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/svg+xml");
    expect(res.payload).toContain("<svg");
  }, 15000);

  it("renders with dark theme", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: {
        type: "bar",
        theme: "dark",
        config: {
          data: [{ x: "A", y: 10 }],
          xAxis: { key: "x" },
          series: [{ key: "y" }],
        },
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.length).toBeGreaterThan(500);
  }, 15000);

  it("returns cached result on second request", async () => {
    const payload = {
      type: "bar",
      config: {
        data: [{ x: "Cached", y: 42 }],
        xAxis: { key: "x" },
        series: [{ key: "y" }],
      },
    };

    const res1 = await app.inject({ method: "POST", url: "/chart", payload });
    expect(res1.headers["x-cache"]).toBe("MISS");

    const res2 = await app.inject({ method: "POST", url: "/chart", payload });
    expect(res2.headers["x-cache"]).toBe("HIT");
    expect(res2.rawPayload.length).toBe(res1.rawPayload.length);
  }, 20000);

  it("returns 400 for invalid config", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/chart",
      payload: {
        type: "invalid",
        config: { data: [] },
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("Validation Error");
  });
});

describe("POST /chart/save + GET /chart/render/:id", () => {
  it("saves and renders a chart by ID", async () => {
    const saveRes = await app.inject({
      method: "POST",
      url: "/chart/save",
      payload: {
        type: "line",
        config: {
          data: [{ x: "A", y: 5 }, { x: "B", y: 15 }],
          xAxis: { key: "x" },
          series: [{ key: "y" }],
        },
      },
    });

    expect(saveRes.statusCode).toBe(201);
    const { id, url } = saveRes.json();
    expect(id).toBeDefined();
    expect(url).toContain(id);

    const renderRes = await app.inject({ method: "GET", url });
    expect(renderRes.statusCode).toBe(200);
    expect(renderRes.headers["content-type"]).toBe("image/png");
    expect(renderRes.rawPayload.length).toBeGreaterThan(500);
  }, 20000);

  it("returns 404 for unknown ID", async () => {
    const res = await app.inject({ method: "GET", url: "/chart/render/nonexistent" });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("Not Found");
  });
});

describe("GET /chart/preview", () => {
  it("returns HTML preview page", async () => {
    const res = await app.inject({ method: "GET", url: "/chart/preview" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.payload).toContain("chartcn");
    expect(res.payload).toContain("Render Chart");
  });
});
