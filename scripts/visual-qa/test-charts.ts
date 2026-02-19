/**
 * Comprehensive test chart configurations for visual QA.
 * Each entry defines a chart config, a description of what it tests,
 * and expectations for what should be visible in the rendered output.
 */

export interface TestChart {
  name: string;
  description: string;
  config: {
    type: string;
    width?: number;
    height?: number;
    format?: string;
    theme?: string;
    config: Record<string, unknown>;
  };
  expectations: {
    seriesCount?: number;
    dataPointCount?: number;
    features?: string[];
    theme?: string;
    notes?: string;
  };
}

// --- Helpers ---

function months(n: number) {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names.slice(0, n);
}

function generateData(count: number, keys: string[], xKey = "x") {
  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, unknown> = { [xKey]: `P${i + 1}` };
    for (const k of keys) {
      row[k] = Math.round(Math.random() * 200 + 50);
    }
    return row;
  });
}

// --- Dark variant helpers ---

function darkVariant(chart: TestChart): TestChart {
  return {
    ...chart,
    name: `${chart.name}-dark`,
    description: `${chart.description} (dark theme)`,
    config: {
      ...chart.config,
      theme: "dark",
    },
    expectations: {
      ...chart.expectations,
      theme: "dark",
      features: [...(chart.expectations.features ?? []), "dark background", "light text"],
    },
  };
}

function withDarkVariants(charts: TestChart[]): TestChart[] {
  return charts.flatMap(c => [c, darkVariant(c)]);
}

// --- Chart categories ---

const chartTypes: TestChart[] = [
  {
    name: "line-basic",
    description: "Basic 2-series line chart with default settings",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        title: "Website Traffic",
        xAxis: { key: "month" },
        data: [
          { month: "Jan", desktop: 186, mobile: 80 },
          { month: "Feb", desktop: 305, mobile: 200 },
          { month: "Mar", desktop: 237, mobile: 120 },
          { month: "Apr", desktop: 273, mobile: 190 },
          { month: "May", desktop: 209, mobile: 130 },
          { month: "Jun", desktop: 314, mobile: 240 },
        ],
        series: [
          { key: "desktop", label: "Desktop" },
          { key: "mobile", label: "Mobile" },
        ],
        legend: true,
        grid: true,
      },
    },
    expectations: {
      seriesCount: 2,
      dataPointCount: 6,
      features: ["title", "legend", "grid", "curved lines"],
      theme: "default",
    },
  },
  {
    name: "area-basic",
    description: "Basic 2-series area chart with gradient fill",
    config: {
      type: "area",
      width: 600,
      height: 400,
      config: {
        title: "Revenue Over Time",
        xAxis: { key: "month" },
        data: [
          { month: "Jan", desktop: 186, mobile: 80 },
          { month: "Feb", desktop: 305, mobile: 200 },
          { month: "Mar", desktop: 237, mobile: 120 },
          { month: "Apr", desktop: 273, mobile: 190 },
        ],
        series: [
          { key: "desktop", label: "Desktop", fill: true },
          { key: "mobile", label: "Mobile", fill: true },
        ],
        legend: true,
        curved: true,
      },
    },
    expectations: {
      seriesCount: 2,
      dataPointCount: 4,
      features: ["title", "legend", "gradient fill", "curved"],
      theme: "default",
    },
  },
  {
    name: "bar-basic",
    description: "Basic grouped 2-series bar chart",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Monthly Revenue",
        description: "Revenue vs Profit comparison",
        xAxis: { key: "month" },
        data: [
          { month: "Jan", revenue: 186, profit: 80 },
          { month: "Feb", revenue: 305, profit: 200 },
          { month: "Mar", revenue: 237, profit: 120 },
        ],
        series: [
          { key: "revenue", label: "Revenue" },
          { key: "profit", label: "Profit" },
        ],
        legend: true,
        grid: true,
      },
    },
    expectations: {
      seriesCount: 2,
      dataPointCount: 3,
      features: ["title", "description", "legend", "grid", "bar radius"],
      theme: "default",
    },
  },
  {
    name: "pie-basic",
    description: "Standard pie chart with labels",
    config: {
      type: "pie",
      width: 500,
      height: 400,
      config: {
        data: [
          { name: "Chrome", value: 275 },
          { name: "Safari", value: 200 },
          { name: "Firefox", value: 187 },
          { name: "Edge", value: 173 },
          { name: "Other", value: 90 },
        ],
        labels: true,
        legend: true,
      },
    },
    expectations: {
      seriesCount: 5,
      dataPointCount: 5,
      features: ["labels", "legend", "5 colors"],
      theme: "default",
    },
  },
  {
    name: "radar-basic",
    description: "Basic 2-series radar chart with polygon grid",
    config: {
      type: "radar",
      width: 500,
      height: 400,
      config: {
        title: "Skills Comparison",
        xAxis: { key: "subject" },
        data: [
          { subject: "Math", A: 120, B: 110 },
          { subject: "Chinese", A: 98, B: 130 },
          { subject: "English", A: 86, B: 130 },
          { subject: "Geography", A: 99, B: 100 },
          { subject: "Physics", A: 85, B: 90 },
          { subject: "History", A: 65, B: 85 },
        ],
        series: [
          { key: "A", label: "Student A" },
          { key: "B", label: "Student B" },
        ],
        legend: true,
        filled: true,
      },
    },
    expectations: {
      seriesCount: 2,
      dataPointCount: 6,
      features: ["title", "legend", "filled", "polygon grid"],
      theme: "default",
    },
  },
  {
    name: "radial-basic",
    description: "Radial bar chart with labels",
    config: {
      type: "radial",
      width: 500,
      height: 400,
      config: {
        data: [
          { name: "Chrome", value: 275, color: "hsl(221.2, 83.2%, 53.3%)" },
          { name: "Safari", value: 200, color: "hsl(346.8, 77.2%, 49.8%)" },
          { name: "Firefox", value: 187, color: "hsl(142.1, 76.2%, 36.3%)" },
        ],
        showLabel: true,
        legend: true,
      },
    },
    expectations: {
      seriesCount: 3,
      dataPointCount: 3,
      features: ["labels", "legend", "background bars"],
      theme: "default",
    },
  },
];

const variants: TestChart[] = [
  {
    name: "line-curved",
    description: "Line chart with monotone interpolation (curved: true)",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        xAxis: { key: "x" },
        data: [
          { x: "A", y: 10 },
          { x: "B", y: 45 },
          { x: "C", y: 20 },
          { x: "D", y: 60 },
          { x: "E", y: 35 },
        ],
        series: [{ key: "y", label: "Value" }],
        curved: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 5,
      features: ["smooth monotone curve"],
      theme: "default",
    },
  },
  {
    name: "line-linear",
    description: "Line chart with linear interpolation (curved: false)",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        xAxis: { key: "x" },
        data: [
          { x: "A", y: 10 },
          { x: "B", y: 45 },
          { x: "C", y: 20 },
          { x: "D", y: 60 },
          { x: "E", y: 35 },
        ],
        series: [{ key: "y", label: "Value" }],
        curved: false,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 5,
      features: ["straight line segments"],
      theme: "default",
    },
  },
  {
    name: "area-stacked",
    description: "Stacked area chart with 3 series",
    config: {
      type: "area",
      width: 600,
      height: 400,
      config: {
        title: "Stacked Traffic Sources",
        xAxis: { key: "month" },
        data: [
          { month: "Jan", organic: 120, direct: 80, referral: 40 },
          { month: "Feb", organic: 150, direct: 90, referral: 55 },
          { month: "Mar", organic: 170, direct: 100, referral: 60 },
          { month: "Apr", organic: 140, direct: 110, referral: 70 },
        ],
        series: [
          { key: "organic", label: "Organic", fill: true },
          { key: "direct", label: "Direct", fill: true },
          { key: "referral", label: "Referral", fill: true },
        ],
        stacked: true,
        legend: true,
        curved: true,
      },
    },
    expectations: {
      seriesCount: 3,
      dataPointCount: 4,
      features: ["stacked", "gradient fill", "legend", "title"],
      theme: "default",
    },
  },
  {
    name: "bar-stacked",
    description: "Stacked bar chart with 2 series",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Stacked Revenue",
        xAxis: { key: "q" },
        data: [
          { q: "Q1", online: 400, retail: 240 },
          { q: "Q2", online: 300, retail: 139 },
          { q: "Q3", online: 200, retail: 380 },
          { q: "Q4", online: 278, retail: 390 },
        ],
        series: [
          { key: "online", label: "Online" },
          { key: "retail", label: "Retail" },
        ],
        stacked: true,
        legend: true,
        grid: true,
      },
    },
    expectations: {
      seriesCount: 2,
      dataPointCount: 4,
      features: ["stacked", "legend", "grid", "title"],
      theme: "default",
    },
  },
  {
    name: "bar-horizontal",
    description: "Horizontal bar chart layout",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Horizontal Bars",
        xAxis: { key: "category" },
        data: [
          { category: "Product A", sales: 430 },
          { category: "Product B", sales: 380 },
          { category: "Product C", sales: 520 },
          { category: "Product D", sales: 290 },
        ],
        series: [{ key: "sales", label: "Sales" }],
        horizontal: true,
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 4,
      features: ["horizontal layout", "grid", "title"],
      theme: "default",
    },
  },
  {
    name: "pie-donut",
    description: "Donut chart with labels and legend",
    config: {
      type: "pie",
      width: 500,
      height: 400,
      config: {
        title: "Browser Share",
        data: [
          { name: "Chrome", value: 63 },
          { name: "Safari", value: 19 },
          { name: "Firefox", value: 10 },
          { name: "Other", value: 8 },
        ],
        donut: true,
        labels: true,
        legend: true,
      },
    },
    expectations: {
      seriesCount: 4,
      dataPointCount: 4,
      features: ["donut hole", "labels with percent", "legend", "title"],
      theme: "default",
    },
  },
  {
    name: "radar-circle",
    description: "Radar chart with circle grid type",
    config: {
      type: "radar",
      width: 500,
      height: 400,
      config: {
        xAxis: { key: "metric" },
        data: [
          { metric: "Speed", value: 90 },
          { metric: "Reliability", value: 85 },
          { metric: "Comfort", value: 70 },
          { metric: "Safety", value: 95 },
          { metric: "Efficiency", value: 80 },
        ],
        series: [{ key: "value", label: "Score" }],
        gridType: "circle",
        filled: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 5,
      features: ["circle grid", "filled"],
      theme: "default",
    },
  },
];

const multiSeries: TestChart[] = [
  {
    name: "series-single",
    description: "Single series — no legend needed",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        title: "Single Metric",
        xAxis: { key: "x" },
        data: [
          { x: "W1", y: 100 },
          { x: "W2", y: 120 },
          { x: "W3", y: 115 },
          { x: "W4", y: 140 },
        ],
        series: [{ key: "y", label: "Users" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 4,
      features: ["title", "grid", "no legend"],
      theme: "default",
    },
  },
  {
    name: "series-five",
    description: "5 series to test full palette cycling",
    config: {
      type: "line",
      width: 700,
      height: 450,
      config: {
        title: "Five Product Lines",
        xAxis: { key: "month" },
        data: [
          { month: "Jan", a: 120, b: 98, c: 86, d: 99, e: 65 },
          { month: "Feb", a: 132, b: 100, c: 90, d: 80, e: 75 },
          { month: "Mar", a: 101, b: 120, c: 95, d: 110, e: 80 },
          { month: "Apr", a: 134, b: 108, c: 100, d: 95, e: 90 },
        ],
        series: [
          { key: "a", label: "Alpha" },
          { key: "b", label: "Beta" },
          { key: "c", label: "Gamma" },
          { key: "d", label: "Delta" },
          { key: "e", label: "Epsilon" },
        ],
        legend: true,
        grid: true,
      },
    },
    expectations: {
      seriesCount: 5,
      dataPointCount: 4,
      features: ["5 distinct colors", "legend", "all 5 palette colors used"],
      theme: "default",
    },
  },
];

const featureToggles: TestChart[] = [
  {
    name: "feature-legend",
    description: "Chart with legend, title, and description all present",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Q4 Performance",
        description: "Revenue by channel for the last quarter",
        xAxis: { key: "month" },
        data: [
          { month: "Oct", web: 400, app: 300 },
          { month: "Nov", web: 450, app: 350 },
          { month: "Dec", web: 500, app: 400 },
        ],
        series: [
          { key: "web", label: "Web" },
          { key: "app", label: "App" },
        ],
        legend: true,
        grid: true,
      },
    },
    expectations: {
      seriesCount: 2,
      dataPointCount: 3,
      features: ["title", "description", "legend", "grid"],
      theme: "default",
    },
  },
  {
    name: "feature-no-grid",
    description: "Chart with grid explicitly disabled",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        title: "No Grid",
        xAxis: { key: "x" },
        data: [
          { x: "A", y: 30 },
          { x: "B", y: 50 },
          { x: "C", y: 40 },
        ],
        series: [{ key: "y" }],
        grid: false,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 3,
      features: ["no grid lines", "title"],
      theme: "default",
    },
  },
  {
    name: "feature-no-legend",
    description: "Multi-series chart without legend",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        xAxis: { key: "x" },
        data: [
          { x: "A", a: 10, b: 20 },
          { x: "B", a: 30, b: 15 },
        ],
        series: [
          { key: "a", label: "Series A" },
          { key: "b", label: "Series B" },
        ],
        legend: false,
        grid: true,
      },
    },
    expectations: {
      seriesCount: 2,
      dataPointCount: 2,
      features: ["no legend", "grid"],
      theme: "default",
      notes: "Legend absent despite 2 series — intentional",
    },
  },
  {
    name: "feature-title-desc",
    description: "Title and description rendering",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        title: "Monthly Active Users",
        description: "Tracking growth across all platforms since January",
        xAxis: { key: "month" },
        data: [
          { month: "Jan", users: 1200 },
          { month: "Feb", users: 1900 },
          { month: "Mar", users: 2400 },
        ],
        series: [{ key: "users" }],
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 3,
      features: ["title text visible", "description text visible"],
      theme: "default",
    },
  },
  {
    name: "feature-axis-labels",
    description: "Custom axis labels on both axes",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Sales by Region",
        xAxis: { key: "region", label: "Region" },
        yAxis: { label: "Revenue ($K)" },
        data: [
          { region: "North", revenue: 400 },
          { region: "South", revenue: 300 },
          { region: "East", revenue: 500 },
          { region: "West", revenue: 350 },
        ],
        series: [{ key: "revenue", label: "Revenue" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 4,
      features: ["x-axis label", "y-axis label", "title"],
      theme: "default",
    },
  },
];

const edgeCases: TestChart[] = [
  {
    name: "edge-single-point",
    description: "Only 1 data point — chart should still render",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        xAxis: { key: "x" },
        data: [{ x: "Only", y: 42 }],
        series: [{ key: "y" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 1,
      features: ["single bar visible", "grid"],
      theme: "default",
      notes: "Should render a single bar centered, not crash",
    },
  },
  {
    name: "edge-all-zeros",
    description: "All Y values are 0 — axes should still render",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "All Zeros",
        xAxis: { key: "x" },
        data: [
          { x: "A", y: 0 },
          { x: "B", y: 0 },
          { x: "C", y: 0 },
        ],
        series: [{ key: "y" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 3,
      features: ["empty-looking bars", "y-axis at 0"],
      theme: "default",
      notes: "Bars should be flat/invisible, axes and grid still present",
    },
  },
  {
    name: "edge-negative",
    description: "All negative values",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Negative Values",
        xAxis: { key: "x" },
        data: [
          { x: "A", y: -50 },
          { x: "B", y: -120 },
          { x: "C", y: -30 },
        ],
        series: [{ key: "y", label: "Loss" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 3,
      features: ["bars below zero line"],
      theme: "default",
      notes: "Y-axis should show negative scale, bars extend downward",
    },
  },
  {
    name: "edge-mixed-signs",
    description: "Mix of positive and negative values",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Profit & Loss",
        xAxis: { key: "month" },
        data: [
          { month: "Jan", profit: 50 },
          { month: "Feb", profit: -30 },
          { month: "Mar", profit: 80 },
          { month: "Apr", profit: -60 },
          { month: "May", profit: 120 },
        ],
        series: [{ key: "profit", label: "Profit" }],
        grid: true,
        legend: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 5,
      features: ["bars above and below zero", "zero line visible"],
      theme: "default",
    },
  },
  {
    name: "edge-large-numbers",
    description: "Very large numbers (999,999+)",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Large Scale Data",
        xAxis: { key: "x" },
        data: [
          { x: "A", y: 1250000 },
          { x: "B", y: 3800000 },
          { x: "C", y: 950000 },
          { x: "D", y: 5200000 },
        ],
        series: [{ key: "y", label: "Revenue" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 4,
      features: ["large Y-axis labels", "grid"],
      theme: "default",
      notes: "Y-axis labels should abbreviate or fit without clipping",
    },
  },
  {
    name: "edge-small-decimals",
    description: "Very small decimal values (0.001–0.1)",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        title: "Precision Data",
        xAxis: { key: "x" },
        data: [
          { x: "T1", y: 0.001 },
          { x: "T2", y: 0.042 },
          { x: "T3", y: 0.018 },
          { x: "T4", y: 0.095 },
          { x: "T5", y: 0.003 },
        ],
        series: [{ key: "y", label: "Error Rate" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 5,
      features: ["decimal Y-axis labels", "line visible with variation"],
      theme: "default",
    },
  },
  {
    name: "edge-many-points",
    description: "100+ data points on a line chart",
    config: {
      type: "line",
      width: 800,
      height: 400,
      config: {
        title: "High Density Data (100 points)",
        xAxis: { key: "x", hide: true },
        data: Array.from({ length: 100 }, (_, i) => ({
          x: `${i}`,
          y: Math.round(Math.sin(i / 5) * 50 + 100 + Math.random() * 20),
        })),
        series: [{ key: "y", label: "Signal" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 100,
      features: ["dense line", "x-axis hidden", "smooth wave pattern"],
      theme: "default",
      notes: "Line should be readable despite density, no performance issues",
    },
  },
  {
    name: "edge-long-labels",
    description: "Very long category labels that might overflow",
    config: {
      type: "bar",
      width: 600,
      height: 400,
      config: {
        title: "Long Labels Test",
        xAxis: { key: "category" },
        data: [
          { category: "Enterprise Cloud Solutions", value: 120 },
          { category: "Small Business Package", value: 95 },
          { category: "Government & Public Sector", value: 140 },
          { category: "Non-Profit Organization", value: 60 },
        ],
        series: [{ key: "value" }],
        grid: true,
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 4,
      features: ["long x-axis labels"],
      theme: "default",
      notes: "Labels should not overlap or clip — may truncate or rotate",
    },
  },
  {
    name: "edge-empty-data",
    description: "Minimal data array (1 item) — boundary test",
    config: {
      type: "line",
      width: 600,
      height: 400,
      config: {
        xAxis: { key: "x" },
        data: [{ x: "Solo", y: 50 }],
        series: [{ key: "y" }],
      },
    },
    expectations: {
      seriesCount: 1,
      dataPointCount: 1,
      features: ["single point"],
      theme: "default",
      notes: "Should render without crashing — may show a dot or nothing visible",
    },
  },
];

// --- Compose all test charts (29 light + 29 dark = 58 total) ---

export const testCharts: TestChart[] = [
  ...withDarkVariants(chartTypes),
  ...withDarkVariants(variants),
  ...withDarkVariants(multiSeries),
  ...withDarkVariants(featureToggles),
  ...withDarkVariants(edgeCases),
];
