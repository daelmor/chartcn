import type { ChartConfig, SeriesConfig, Theme } from "../schemas/chart-config.js";
import { resolveColor } from "./theme.js";

export interface ResolvedSeries {
  key: string;
  label: string;
  color: string;
  fill: boolean;
  opacity: number;
  radius: number;
  strokeWidth: number;
  strokeDash?: string;
}

export function resolveSeries(
  config: ChartConfig,
  theme: Theme
): ResolvedSeries[] {
  if (config.series && config.series.length > 0) {
    return config.series.map((s, i) => ({
      key: s.key,
      label: s.label ?? s.key,
      color: resolveColor(i, s.color, theme),
      fill: s.fill ?? false,
      opacity: s.opacity ?? 0.4,
      radius: s.radius ?? 4,
      strokeWidth: s.strokeWidth ?? 2,
      strokeDash: s.strokeDash,
    }));
  }

  // Auto-detect series from data keys (exclude xAxis key)
  if (config.data.length === 0) return [];

  const xKey = config.xAxis?.key;
  const keys = Object.keys(config.data[0]).filter(
    (k) => k !== xKey && typeof config.data[0][k] === "number"
  );

  return keys.map((key, i) => ({
    key,
    label: key,
    color: resolveColor(i, undefined, theme),
    fill: false,
    opacity: 0.4,
    radius: 4,
    strokeWidth: 2,
  }));
}

export function getCurveType(curved?: boolean): "monotone" | "linear" {
  return curved !== false ? "monotone" : "linear";
}
