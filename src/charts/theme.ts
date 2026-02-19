export const SHADCN_COLORS = {
  default: [
    "hsl(221.2, 83.2%, 53.3%)", // --chart-1 blue
    "hsl(346.8, 77.2%, 49.8%)", // --chart-2 rose
    "hsl(142.1, 76.2%, 36.3%)", // --chart-3 green
    "hsl(47.9, 95.8%, 53.1%)",  // --chart-4 amber
    "hsl(262.1, 83.3%, 57.8%)", // --chart-5 violet
  ],
  dark: [
    "hsl(217.2, 91.2%, 59.8%)", // --chart-1 blue
    "hsl(349.7, 89.2%, 60.2%)", // --chart-2 rose
    "hsl(142.1, 70.6%, 45.3%)", // --chart-3 green
    "hsl(47.9, 95.8%, 53.1%)",  // --chart-4 amber
    "hsl(263.4, 70%, 50.4%)",   // --chart-5 violet
  ],
};

export function getThemeCSS(theme: "default" | "dark"): string {
  const isLight = theme === "default";

  return `
    :root {
      --background: ${isLight ? "0 0% 100%" : "222.2 84% 4.9%"};
      --foreground: ${isLight ? "222.2 84% 4.9%" : "210 40% 98%"};
      --card: ${isLight ? "0 0% 100%" : "222.2 84% 4.9%"};
      --card-foreground: ${isLight ? "222.2 84% 4.9%" : "210 40% 98%"};
      --muted: ${isLight ? "210 40% 96.1%" : "217.2 32.6% 17.5%"};
      --muted-foreground: ${isLight ? "215.4 16.3% 46.9%" : "215 20.2% 65.1%"};
      --border: ${isLight ? "214.3 31.8% 91.4%" : "217.2 32.6% 17.5%"};
      --radius: 0.5rem;
      --chart-1: ${isLight ? "221.2 83.2% 53.3%" : "217.2 91.2% 59.8%"};
      --chart-2: ${isLight ? "346.8 77.2% 49.8%" : "349.7 89.2% 60.2%"};
      --chart-3: ${isLight ? "142.1 76.2% 36.3%" : "142.1 70.6% 45.3%"};
      --chart-4: ${isLight ? "47.9 95.8% 53.1%" : "47.9 95.8% 53.1%"};
      --chart-5: ${isLight ? "262.1 83.3% 57.8%" : "263.4 70% 50.4%"};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: ${isLight ? "#ffffff" : "#0a0a0a"};
      color: ${isLight ? "#0a0a0a" : "#fafafa"};
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
    }

    .chart-header {
      text-align: center;
      margin-bottom: 8px;
      width: 100%;
    }

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      color: ${isLight ? "#0a0a0a" : "#fafafa"};
    }

    .chart-description {
      font-size: 12px;
      color: ${isLight ? "hsl(215.4, 16.3%, 46.9%)" : "hsl(215, 20.2%, 65.1%)"};
      margin-top: 2px;
    }

    .recharts-cartesian-grid line {
      stroke: ${isLight ? "hsl(214.3, 31.8%, 91.4%)" : "hsl(217.2, 32.6%, 17.5%)"};
    }

    .recharts-text {
      fill: ${isLight ? "hsl(215.4, 16.3%, 46.9%)" : "hsl(215, 20.2%, 65.1%)"};
      font-size: 12px;
    }

    .recharts-legend-item-text {
      color: ${isLight ? "#0a0a0a" : "#fafafa"} !important;
      font-size: 12px;
    }

    .recharts-default-tooltip {
      background: ${isLight ? "#ffffff" : "#1a1a2e"} !important;
      border: 1px solid ${isLight ? "hsl(214.3, 31.8%, 91.4%)" : "hsl(217.2, 32.6%, 17.5%)"} !important;
      border-radius: 6px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    }
  `;
}

export function resolveColor(
  index: number,
  explicitColor: string | undefined,
  theme: "default" | "dark"
): string {
  if (explicitColor) return explicitColor;
  const palette = SHADCN_COLORS[theme];
  return palette[index % palette.length];
}
