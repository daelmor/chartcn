import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartConfig, Theme } from "../../schemas/chart-config.js";
import { resolveSeries } from "../utils.js";
import { ChartWrapper } from "./chart-wrapper.js";

interface Props {
  config: ChartConfig;
  width: number;
  height: number;
  theme: Theme;
}

export function BarChartComponent({ config, width, height, theme }: Props) {
  const series = resolveSeries(config, theme);
  const xKey = config.xAxis?.key ?? Object.keys(config.data[0])[0];
  const isHorizontal = config.horizontal === true;
  const chartWidth = width - 32;
  const chartHeight = height - (config.title ? 82 : 32);

  return (
    <ChartWrapper config={config} width={width} height={height}>
      <BarChart
        data={config.data}
        width={chartWidth}
        height={chartHeight}
        layout={isHorizontal ? "vertical" : "horizontal"}
      >
        {config.grid !== false && <CartesianGrid strokeDasharray="3 3" />}
        {isHorizontal ? (
          <>
            <YAxis
              dataKey={xKey}
              type="category"
              hide={config.yAxis?.hide}
            />
            <XAxis
              type="number"
              hide={config.xAxis?.hide}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              hide={config.xAxis?.hide}
              label={config.xAxis?.label ? { value: config.xAxis.label, position: "insideBottom", offset: -5 } : undefined}
            />
            <YAxis
              hide={config.yAxis?.hide}
              label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: "insideLeft" } : undefined}
            />
          </>
        )}
        {config.tooltip !== false && <Tooltip />}
        {config.legend && <Legend />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            radius={[s.radius, s.radius, 0, 0]}
            stackId={config.stacked ? "stack" : undefined}
          />
        ))}
      </BarChart>
    </ChartWrapper>
  );
}
