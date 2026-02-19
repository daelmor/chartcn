/**
 * Client-side entry point bundled by esbuild.
 * This runs inside Puppeteer to render charts in the browser.
 * The chart config is injected as window.__CHART_CONFIG__ by the HTML template.
 */
import ReactDOM from "react-dom/client";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

declare global {
  interface Window {
    __CHART_CONFIG__: {
      type: string;
      width: number;
      height: number;
      theme: string;
      config: Record<string, unknown>;
    };
    __CHART_READY__: boolean;
  }
}

const COLORS = {
  default: [
    "hsl(221.2, 83.2%, 53.3%)",
    "hsl(346.8, 77.2%, 49.8%)",
    "hsl(142.1, 76.2%, 36.3%)",
    "hsl(47.9, 95.8%, 53.1%)",
    "hsl(262.1, 83.3%, 57.8%)",
  ],
  dark: [
    "hsl(217.2, 91.2%, 59.8%)",
    "hsl(349.7, 89.2%, 60.2%)",
    "hsl(142.1, 70.6%, 45.3%)",
    "hsl(47.9, 95.8%, 53.1%)",
    "hsl(263.4, 70%, 50.4%)",
  ],
};

function resolveColor(index: number, explicit: string | undefined, theme: string): string {
  if (explicit) return explicit;
  const palette = theme === "dark" ? COLORS.dark : COLORS.default;
  return palette[index % palette.length];
}

interface Series {
  key: string;
  label: string;
  color: string;
  fill: boolean;
  opacity: number;
  radius: number;
  strokeWidth: number;
  strokeDash?: string;
}

function resolveSeries(config: Record<string, unknown>, theme: string): Series[] {
  const seriesArr = config.series as Array<Record<string, unknown>> | undefined;
  const data = config.data as Array<Record<string, unknown>>;
  if (seriesArr && seriesArr.length > 0) {
    return seriesArr.map((s, i) => ({
      key: s.key as string,
      label: (s.label as string) ?? (s.key as string),
      color: resolveColor(i, s.color as string | undefined, theme),
      fill: (s.fill as boolean) ?? false,
      opacity: (s.opacity as number) ?? 0.4,
      radius: (s.radius as number) ?? 4,
      strokeWidth: (s.strokeWidth as number) ?? 2,
      strokeDash: s.strokeDash as string | undefined,
    }));
  }
  const xAxisConf = config.xAxis as Record<string, unknown> | undefined;
  const xKey = xAxisConf?.key as string | undefined;
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === "number");
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

function getCurveType(curved?: boolean): "monotone" | "linear" {
  return curved !== false ? "monotone" : "linear";
}

function ChartHeader({ config }: { config: Record<string, unknown> }) {
  if (!config.title) return null;
  return (
    <div className="chart-header">
      <div className="chart-title">{config.title as string}</div>
      {config.description ? <div className="chart-description">{String(config.description)}</div> : null}
    </div>
  );
}

function RenderChart() {
  const { type, width, height, theme, config } = window.__CHART_CONFIG__;
  const data = config.data as Array<Record<string, unknown>>;
  const xAxisConf = config.xAxis as Record<string, unknown> | undefined;
  const yAxisConf = config.yAxis as Record<string, unknown> | undefined;
  const xKey = (xAxisConf?.key as string) ?? Object.keys(data[0])[0];
  const series = resolveSeries(config, theme);
  const curveType = getCurveType(config.curved as boolean | undefined);
  const headerHeight = config.title ? (config.description ? 50 : 30) : 0;
  const chartWidth = width - 32;
  const chartHeight = height - headerHeight - 32;
  const showTooltip = config.tooltip !== false;
  const showLegend = config.legend === true;
  const showGrid = config.grid !== false;

  const xAxisLabel = xAxisConf?.label ? { value: xAxisConf.label as string, position: "insideBottom" as const, offset: -5 } : undefined;
  const yAxisLabel = yAxisConf?.label ? { value: yAxisConf.label as string, angle: -90, position: "insideLeft" as const } : undefined;

  return (
    <div className="chart-container" style={{ width, height }}>
      <ChartHeader config={config} />
      <div style={{ width: chartWidth, height: Math.max(chartHeight, 100) }}>
        {type === "line" && (
          <LineChart data={data} width={chartWidth} height={chartHeight}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} hide={xAxisConf?.hide as boolean} label={xAxisLabel} />
            <YAxis hide={yAxisConf?.hide as boolean} label={yAxisLabel} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {series.map(s => (
              <Line key={s.key} type={curveType} dataKey={s.key} name={s.label}
                stroke={s.color} strokeWidth={s.strokeWidth} strokeDasharray={s.strokeDash}
                dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            ))}
          </LineChart>
        )}
        {type === "area" && (
          <AreaChart data={data} width={chartWidth} height={chartHeight}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} hide={xAxisConf?.hide as boolean} label={xAxisLabel} />
            <YAxis hide={yAxisConf?.hide as boolean} label={yAxisLabel} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <defs>
              {series.map(s => (
                <linearGradient key={`g-${s.key}`} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            {series.map(s => (
              <Area key={s.key} type={curveType} dataKey={s.key} name={s.label}
                stroke={s.color} strokeWidth={s.strokeWidth}
                fill={s.fill !== false ? `url(#gradient-${s.key})` : "none"}
                fillOpacity={1}
                stackId={config.stacked ? "stack" : undefined} isAnimationActive={false} />
            ))}
          </AreaChart>
        )}
        {type === "bar" && (() => {
          const isHorizontal = config.horizontal === true;
          return (
            <BarChart data={data} width={chartWidth} height={chartHeight}
              layout={isHorizontal ? "vertical" : "horizontal"}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              {isHorizontal ? (
                <>
                  <YAxis dataKey={xKey} type="category" hide={yAxisConf?.hide as boolean} />
                  <XAxis type="number" hide={xAxisConf?.hide as boolean} />
                </>
              ) : (
                <>
                  <XAxis dataKey={xKey} hide={xAxisConf?.hide as boolean} label={xAxisLabel} />
                  <YAxis hide={yAxisConf?.hide as boolean} label={yAxisLabel} />
                </>
              )}
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {series.map(s => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color}
                  radius={[s.radius, s.radius, 0, 0]}
                  stackId={config.stacked ? "stack" : undefined} isAnimationActive={false} />
              ))}
            </BarChart>
          );
        })()}
        {type === "pie" && (() => {
          const dataKey = (config.dataKey as string) ?? "value";
          const nameKey = (config.nameKey as string) ?? "name";
          const isDonut = config.donut === true;
          const showLabels = config.labels === true;
          const outerRadius = Math.min(chartWidth, chartHeight) / 2 - 20;
          const innerRad = isDonut ? outerRadius * 0.6 : 0;
          const colors = data.map((d, i) => resolveColor(i, d.color as string | undefined, theme));
          return (
            <PieChart width={chartWidth} height={chartHeight}>
              <Pie data={data} dataKey={dataKey} nameKey={nameKey}
                cx="50%" cy="50%" outerRadius={outerRadius} innerRadius={innerRad}
                label={showLabels ? ({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%` : undefined}
                labelLine={showLabels} isAnimationActive={false}>
                {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Pie>
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
            </PieChart>
          );
        })()}
        {type === "radar" && (() => {
          const isFilled = config.filled !== false;
          const gridType = (config.gridType as "circle" | "polygon") ?? "polygon";
          return (
            <RadarChart data={data} width={chartWidth} height={chartHeight}
              cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid gridType={gridType} />
              <PolarAngleAxis dataKey={xKey} />
              <PolarRadiusAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {series.map(s => (
                <Radar key={s.key} name={s.label} dataKey={s.key} stroke={s.color}
                  fill={isFilled ? s.color : "none"} fillOpacity={isFilled ? 0.3 : 0}
                  strokeWidth={s.strokeWidth} isAnimationActive={false} />
              ))}
            </RadarChart>
          );
        })()}
        {type === "radial" && (() => {
          const dataKey = (config.dataKey as string) ?? "value";
          const innerRad = (config.innerRadius as number) ?? 30;
          const startAngle = (config.startAngle as number) ?? 180;
          const endAngle = (config.endAngle as number) ?? 0;
          const coloredData = data.map((d, i) => ({
            ...d,
            fill: (d.color as string) ?? resolveColor(i, undefined, theme),
          }));
          return (
            <RadialBarChart data={coloredData} width={chartWidth} height={chartHeight}
              cx="50%" cy="50%" innerRadius={innerRad} outerRadius="80%"
              barSize={20} startAngle={startAngle} endAngle={endAngle}>
              <RadialBar dataKey={dataKey} background isAnimationActive={false}
                label={config.showLabel ? { position: "insideStart" as const, fill: "#fff", fontSize: 12 } : undefined} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />}
            </RadialBarChart>
          );
        })()}
      </div>
    </div>
  );
}

// Mount and signal readiness
const root = document.getElementById("root")!;
ReactDOM.createRoot(root).render(<RenderChart />);

// Use requestAnimationFrame to wait for paint
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.__CHART_READY__ = true;
  });
});
