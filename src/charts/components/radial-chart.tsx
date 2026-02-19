import React from "react";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
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

export function RadialChartComponent({ config, width, height, theme }: Props) {
  const dataKey = config.dataKey ?? "value";
  const chartWidth = width - 32;
  const chartHeight = height - (config.title ? 82 : 32);
  const innerRad = config.innerRadius ?? 30;
  const startAngle = config.startAngle ?? 180;
  const endAngle = config.endAngle ?? 0;

  // Assign colors to data entries if not specified
  const data = config.data.map((d, i) => ({
    ...d,
    fill: (d.color as string) ?? resolveColor(i, undefined, theme),
  }));

  return (
    <ChartWrapper config={config} width={width} height={height}>
      <RadialBarChart
        data={data}
        width={chartWidth}
        height={chartHeight}
        cx="50%"
        cy="50%"
        innerRadius={innerRad}
        outerRadius="80%"
        barSize={20}
        startAngle={startAngle}
        endAngle={endAngle}
      >
        <RadialBar
          dataKey={dataKey}
          background
          label={config.showLabel ? { position: "insideStart", fill: "#fff", fontSize: 12 } : undefined}
        />
        {config.tooltip !== false && <Tooltip />}
        {config.legend && <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />}
      </RadialBarChart>
    </ChartWrapper>
  );
}
