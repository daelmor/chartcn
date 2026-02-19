import React from "react";
import type { ChartConfig, ChartType, Theme } from "../schemas/chart-config.js";
import { LineChartComponent } from "./components/line-chart.js";
import { AreaChartComponent } from "./components/area-chart.js";
import { BarChartComponent } from "./components/bar-chart.js";
import { PieChartComponent } from "./components/pie-chart.js";
import { RadarChartComponent } from "./components/radar-chart.js";
import { RadialChartComponent } from "./components/radial-chart.js";

interface ChartProps {
  config: ChartConfig;
  width: number;
  height: number;
  theme: Theme;
}

type ChartComponent = React.FC<ChartProps>;

const chartRegistry: Record<ChartType, ChartComponent> = {
  line: LineChartComponent,
  area: AreaChartComponent,
  bar: BarChartComponent,
  pie: PieChartComponent,
  radar: RadarChartComponent,
  radial: RadialChartComponent,
};

export function createChartElement(
  type: ChartType,
  config: ChartConfig,
  width: number,
  height: number,
  theme: Theme
): React.ReactElement {
  const Component = chartRegistry[type];
  return React.createElement(Component, { config, width, height, theme });
}
