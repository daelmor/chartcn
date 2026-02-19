import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartConfig, Theme } from "../../schemas/chart-config.js";
import { resolveSeries, getCurveType } from "../utils.js";
import { ChartWrapper } from "./chart-wrapper.js";

interface Props {
  config: ChartConfig;
  width: number;
  height: number;
  theme: Theme;
}

export function AreaChartComponent({ config, width, height, theme }: Props) {
  const series = resolveSeries(config, theme);
  const xKey = config.xAxis?.key ?? Object.keys(config.data[0])[0];
  const curveType = getCurveType(config.curved);
  const chartWidth = width - 32;
  const chartHeight = height - (config.title ? 82 : 32);

  return (
    <ChartWrapper config={config} width={width} height={height}>
      <AreaChart data={config.data} width={chartWidth} height={chartHeight}>
        {config.grid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis
          dataKey={xKey}
          hide={config.xAxis?.hide}
          label={config.xAxis?.label ? { value: config.xAxis.label, position: "insideBottom", offset: -5 } : undefined}
        />
        <YAxis
          hide={config.yAxis?.hide}
          label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: "insideLeft" } : undefined}
        />
        {config.tooltip !== false && <Tooltip />}
        {config.legend && <Legend />}
        <defs>
          {series.map((s) => (
            <linearGradient key={`grad-${s.key}`} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        {series.map((s) => (
          <Area
            key={s.key}
            type={curveType}
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={s.strokeWidth}
            fill={s.fill !== false ? `url(#gradient-${s.key})` : "none"}
            fillOpacity={1}
            stackId={config.stacked ? "stack" : undefined}
          />
        ))}
      </AreaChart>
    </ChartWrapper>
  );
}
