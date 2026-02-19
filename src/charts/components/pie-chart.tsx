import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartConfig, Theme } from "../../schemas/chart-config.js";
import { resolveColor } from "../theme.js";
import { ChartWrapper } from "./chart-wrapper.js";

interface Props {
  config: ChartConfig;
  width: number;
  height: number;
  theme: Theme;
}

export function PieChartComponent({ config, width, height, theme }: Props) {
  const dataKey = config.dataKey ?? "value";
  const nameKey = config.nameKey ?? "name";
  const isDonut = config.donut === true;
  const showLabels = config.labels === true;
  const chartWidth = width - 32;
  const chartHeight = height - (config.title ? 82 : 32);
  const outerRadius = Math.min(chartWidth, chartHeight) / 2 - 20;
  const innerRadius = isDonut ? outerRadius * 0.6 : 0;

  const colors = config.data.map((d, i) => {
    const color = d.color as string | undefined;
    return resolveColor(i, color, theme);
  });

  return (
    <ChartWrapper config={config} width={width} height={height}>
      <PieChart width={chartWidth} height={chartHeight}>
        <Pie
          data={config.data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          label={showLabels ? ({ name, percent }: { name: string; percent: number }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          : undefined}
          labelLine={showLabels}
        >
          {config.data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Pie>
        {config.tooltip !== false && <Tooltip />}
        {config.legend && <Legend />}
      </PieChart>
    </ChartWrapper>
  );
}
