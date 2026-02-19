import { z } from "zod";

export const chartTypes = [
  "line",
  "area",
  "bar",
  "pie",
  "radar",
  "radial",
] as const;

export const outputFormats = ["png", "svg", "pdf"] as const;
export const themes = ["default", "dark"] as const;

export type ChartType = (typeof chartTypes)[number];
export type OutputFormat = (typeof outputFormats)[number];
export type Theme = (typeof themes)[number];

const cssColor = z.string().regex(
  /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+)/,
  "Must be a valid CSS color"
);

const seriesSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional(),
  color: cssColor.optional(),
  fill: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
  radius: z.number().optional(),
  strokeWidth: z.number().optional(),
  strokeDash: z.string().optional(),
});

export type SeriesConfig = z.infer<typeof seriesSchema>;

const axisSchema = z.object({
  key: z.string().optional(),
  label: z.string().optional(),
  hide: z.boolean().optional(),
});

const chartConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  xAxis: axisSchema.optional(),
  yAxis: axisSchema.optional(),
  data: z.array(z.record(z.string(), z.unknown())).min(1),
  series: z.array(seriesSchema).optional(),

  // Pie/donut specific
  dataKey: z.string().optional(),
  nameKey: z.string().optional(),
  donut: z.boolean().optional(),
  labels: z.boolean().optional(),
  innerRadius: z.number().optional(),

  // Common options
  legend: z.boolean().optional(),
  grid: z.boolean().optional(),
  tooltip: z.boolean().optional(),
  stacked: z.boolean().optional(),
  curved: z.boolean().optional(),
  horizontal: z.boolean().optional(),

  // Radar specific
  filled: z.boolean().optional(),
  gridType: z.enum(["circle", "polygon"]).optional(),

  // Radial specific
  startAngle: z.number().optional(),
  endAngle: z.number().optional(),
  showLabel: z.boolean().optional(),
});

export type ChartConfig = z.infer<typeof chartConfigSchema>;

export const chartRequestSchema = z.object({
  type: z.enum(chartTypes).default("bar"),
  width: z.coerce.number().min(50).max(4096).default(600),
  height: z.coerce.number().min(50).max(4096).default(400),
  format: z.enum(outputFormats).default("png"),
  theme: z.enum(themes).default("default"),
  background: cssColor.optional(),
  config: chartConfigSchema,
});

export type ChartRequest = z.infer<typeof chartRequestSchema>;

// For GET requests, data comes as a JSON string in the query
export const chartQuerySchema = z.object({
  type: z.enum(chartTypes).default("bar"),
  width: z.coerce.number().min(50).max(4096).default(600),
  height: z.coerce.number().min(50).max(4096).default(400),
  format: z.enum(outputFormats).default("png"),
  theme: z.enum(themes).default("default"),
  background: cssColor.optional(),
  data: z.string().transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "data must be valid JSON",
      });
      return z.NEVER;
    }
  }),
});
