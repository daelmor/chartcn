import {
  LineChart,
  Line,
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

export function LineChartComponent({ config, width, height, theme }: Props) {
  const series = resolveSeries(config, theme);
  const xKey = config.xAxis?.key ?? Object.keys(config.data[0])[0];
  const curveType = getCurveType(config.curved);

  return (
    <ChartWrapper config={config} width={width} height={height}>
      <LineChart data={config.data} width={width - 32} height={height - (config.title ? 82 : 32)}>
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
        {series.map((s) => (
          <Line
            key={s.key}
            type={curveType}
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={s.strokeWidth}
            strokeDasharray={s.strokeDash}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ChartWrapper>
  );
}
