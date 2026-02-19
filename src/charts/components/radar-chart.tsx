import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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

export function RadarChartComponent({ config, width, height, theme }: Props) {
  const series = resolveSeries(config, theme);
  const xKey = config.xAxis?.key ?? Object.keys(config.data[0])[0];
  const isFilled = config.filled !== false;
  const gridType = config.gridType ?? "polygon";
  const chartWidth = width - 32;
  const chartHeight = height - (config.title ? 82 : 32);

  return (
    <ChartWrapper config={config} width={width} height={height}>
      <RadarChart
        data={config.data}
        width={chartWidth}
        height={chartHeight}
        cx="50%"
        cy="50%"
        outerRadius="80%"
      >
        <PolarGrid gridType={gridType} />
        <PolarAngleAxis dataKey={xKey} />
        <PolarRadiusAxis />
        {config.tooltip !== false && <Tooltip />}
        {config.legend && <Legend />}
        {series.map((s) => (
          <Radar
            key={s.key}
            name={s.label}
            dataKey={s.key}
            stroke={s.color}
            fill={isFilled ? s.color : "none"}
            fillOpacity={isFilled ? 0.3 : 0}
            strokeWidth={s.strokeWidth}
          />
        ))}
      </RadarChart>
    </ChartWrapper>
  );
}
