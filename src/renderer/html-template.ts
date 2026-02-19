import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getThemeCSS } from "../charts/theme.js";
import type { ChartRequest } from "../schemas/chart-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let clientBundle: string | null = null;

export function loadClientBundle(): void {
  const bundlePath = resolve(__dirname, "../../dist/chart-client.js");
  if (existsSync(bundlePath)) {
    clientBundle = readFileSync(bundlePath, "utf-8");
  } else {
    throw new Error(
      `Client bundle not found at ${bundlePath}. Run "npm run bundle:client" first.`
    );
  }
}

export function buildHTML(request: ChartRequest): string {
  if (!clientBundle) {
    loadClientBundle();
  }

  const { type, width, height, theme, background, config } = request;
  const themeCSS = getThemeCSS(theme);
  const bg = background ?? (theme === "dark" ? "#0a0a0a" : "#ffffff");

  const chartConfig = JSON.stringify({
    type,
    width,
    height,
    theme,
    config,
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${themeCSS}</style>
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    background: ${bg};
  }
  #root {
    width: ${width}px;
    height: ${height}px;
  }
</style>
</head>
<body>
<div id="root"></div>
<script>window.__CHART_CONFIG__ = ${chartConfig};</script>
<script>${clientBundle}</script>
</body>
</html>`;
}
