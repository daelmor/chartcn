---
name: recharts
description: Use when working on chart components, adding chart types, modifying chart rendering, or changing the chart config schema. Provides Recharts API reference and project-specific patterns.
user-invocable: true
argument-hint: [component or task description]
---

# Recharts Reference for chartcn

You are working on the **chartcn** chart rendering service. This skill provides Recharts API knowledge and project-specific patterns.

## How charts work in this project

There are **two rendering paths** — understand which one you're modifying:

### 1. Server-side components (`src/charts/components/`)
- Used by Fastify routes for the server-rendering pipeline
- Each chart type has its own React component (e.g., `LineChartComponent`)
- Wrapped in `<ChartWrapper>` which handles title/description
- Data comes from validated `ChartConfig` (Zod schema in `src/schemas/chart-config.ts`)
- Series are resolved via `src/charts/utils.ts` → `resolveSeries()`
- Colors come from `src/charts/theme.ts` → `resolveColor()`

### 2. Client-side bundle (`src/charts/client-entry.tsx`)
- Bundled by esbuild, runs inside Puppeteer
- Self-contained — duplicates some logic from the server components
- Config injected as `window.__CHART_CONFIG__` (untyped `Record<string, unknown>`)
- Signals completion via `window.__CHART_READY__ = true`
- **This is what actually renders the charts** — changes here affect all output formats

### Adding a new chart type — checklist:
1. Add to the `ChartType` enum in `src/schemas/chart-config.ts`
2. Add type-specific config options to the Zod schema
3. Create `src/charts/components/<type>-chart.tsx`
4. Register in `src/charts/index.ts`
5. Add the rendering block in `src/charts/client-entry.tsx`
6. Add a test fixture in `test/fixtures/configs/<type>-chart.json`
7. Add integration test case in `test/integration/api.test.ts`
8. Update README.md chart types table

### Key constraints:
- **No `import React`** — uses `jsx: "react-jsx"` transform
- **No `ResponsiveContainer`** — fixed dimensions from request (width/height)
- **ESM only** — use `.js` extensions in imports
- **Animations should be minimal** — charts are screenshot'd quickly (100ms delay after ready signal)
- **Colors**: Default Shadcn palette cycles through 5 colors. Per-series `color` override supported.

## Quick Recharts patterns used in this project

```tsx
// Standard cartesian chart pattern (line/area/bar)
<LineChart data={data} width={w} height={h}>
  {showGrid && <CartesianGrid strokeDasharray="3 3" />}
  <XAxis dataKey={xKey} hide={config.xAxis?.hide} />
  <YAxis hide={config.yAxis?.hide} />
  {showTooltip && <Tooltip />}
  {showLegend && <Legend />}
  {series.map(s => (
    <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
      stroke={s.color} strokeWidth={s.strokeWidth} dot={false} />
  ))}
</LineChart>

// Pie/donut pattern
<PieChart width={w} height={h}>
  <Pie data={data} dataKey="value" nameKey="name"
    cx="50%" cy="50%" outerRadius={r} innerRadius={isDonut ? r*0.6 : 0}
    label={showLabels}>
    {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
  </Pie>
</PieChart>

// Radar pattern
<RadarChart data={data} width={w} height={h} cx="50%" cy="50%" outerRadius="80%">
  <PolarGrid gridType="polygon" />
  <PolarAngleAxis dataKey={xKey} />
  <PolarRadiusAxis />
  {series.map(s => (
    <Radar key={s.key} dataKey={s.key} stroke={s.color}
      fill={s.color} fillOpacity={0.3} />
  ))}
</RadarChart>

// Stacking: add stackId="stack" to Bar/Area components
// Horizontal bar: layout="vertical" on BarChart, swap XAxis/YAxis roles
```

## Full API reference

See [api-reference.md](api-reference.md) for complete props of every Recharts component.

Task: $ARGUMENTS
