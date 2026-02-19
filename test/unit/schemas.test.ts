import { describe, it, expect } from "vitest";
import { chartRequestSchema, chartQuerySchema } from "../../src/schemas/chart-config.js";

describe("chartRequestSchema", () => {
  it("validates a minimal bar chart config", () => {
    const result = chartRequestSchema.safeParse({
      type: "bar",
      config: {
        data: [{ x: "A", y: 10 }],
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("bar");
      expect(result.data.width).toBe(600); // default
      expect(result.data.height).toBe(400); // default
      expect(result.data.format).toBe("png"); // default
      expect(result.data.theme).toBe("default"); // default
    }
  });

  it("validates a full chart config with all options", () => {
    const result = chartRequestSchema.safeParse({
      type: "area",
      width: 800,
      height: 500,
      format: "svg",
      theme: "dark",
      background: "#000000",
      config: {
        title: "Test",
        description: "Description",
        xAxis: { key: "month", label: "Month" },
        yAxis: { label: "Value" },
        data: [
          { month: "Jan", val: 100 },
          { month: "Feb", val: 200 },
        ],
        series: [
          { key: "val", label: "Value", color: "#ff0000", fill: true, opacity: 0.5 },
        ],
        legend: true,
        grid: true,
        tooltip: false,
        stacked: true,
        curved: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid chart type", () => {
    const result = chartRequestSchema.safeParse({
      type: "scatter",
      config: { data: [{ x: 1 }] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty data array", () => {
    const result = chartRequestSchema.safeParse({
      type: "bar",
      config: { data: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects width out of range", () => {
    const result = chartRequestSchema.safeParse({
      type: "bar",
      width: 10,
      config: { data: [{ x: 1 }] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format", () => {
    const result = chartRequestSchema.safeParse({
      type: "bar",
      format: "gif",
      config: { data: [{ x: 1 }] },
    });
    expect(result.success).toBe(false);
  });

  it("validates pie chart config", () => {
    const result = chartRequestSchema.safeParse({
      type: "pie",
      config: {
        data: [
          { name: "A", value: 30 },
          { name: "B", value: 70 },
        ],
        donut: true,
        labels: true,
        dataKey: "value",
        nameKey: "name",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates radar chart config", () => {
    const result = chartRequestSchema.safeParse({
      type: "radar",
      config: {
        data: [{ subject: "Math", A: 100 }],
        filled: true,
        gridType: "circle",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates series with all optional fields", () => {
    const result = chartRequestSchema.safeParse({
      type: "line",
      config: {
        data: [{ x: 1, y: 2 }],
        series: [
          {
            key: "y",
            label: "Y",
            color: "#123456",
            fill: true,
            opacity: 0.8,
            radius: 6,
            strokeWidth: 3,
            strokeDash: "5 5",
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("chartQuerySchema", () => {
  it("parses valid query params with JSON data", () => {
    const result = chartQuerySchema.safeParse({
      type: "bar",
      width: "600",
      height: "400",
      format: "png",
      data: '{"data":[{"x":"A","y":10}]}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data).toEqual({ data: [{ x: "A", y: 10 }] });
    }
  });

  it("rejects invalid JSON in data param", () => {
    const result = chartQuerySchema.safeParse({
      type: "bar",
      data: "not json",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string width/height to numbers", () => {
    const result = chartQuerySchema.safeParse({
      data: '{"data":[{"x":1}]}',
      width: "800",
      height: "600",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.width).toBe(800);
      expect(result.data.height).toBe(600);
    }
  });
});
