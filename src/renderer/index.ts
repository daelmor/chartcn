import type { ChartRequest, OutputFormat } from "../schemas/chart-config.js";
import { buildHTML, loadClientBundle } from "./html-template.js";
import { acquirePage, releasePage, initBrowserPool, destroyBrowserPool } from "./browser-pool.js";

import type { AppConfig } from "../config.js";

export interface RenderResult {
  data: Buffer;
  contentType: string;
}

const CONTENT_TYPES: Record<OutputFormat, string> = {
  png: "image/png",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export async function initRenderer(config: AppConfig): Promise<void> {
  loadClientBundle();
  await initBrowserPool(config);
}

export async function shutdownRenderer(): Promise<void> {
  await destroyBrowserPool();
}

export async function renderChart(request: ChartRequest): Promise<RenderResult> {
  const html = buildHTML(request);
  const page = await acquirePage();

  try {
    await page.setViewport({
      width: request.width,
      height: request.height,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, { waitUntil: "load" });

    // Wait for the chart to signal readiness
    await page.waitForFunction("window.__CHART_READY__ === true", {
      timeout: 8000,
    });

    // Small extra delay for Recharts animations to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    const format = request.format;
    let data: Buffer;

    if (format === "svg") {
      const svgContent = await page.evaluate(() => {
        const svg = document.querySelector(".recharts-wrapper svg");
        if (!svg) throw new Error("No SVG element found");
        return svg.outerHTML;
      });
      data = Buffer.from(svgContent, "utf-8");
    } else if (format === "pdf") {
      data = Buffer.from(
        await page.pdf({
          width: request.width,
          height: request.height,
          printBackground: true,
          pageRanges: "1",
        })
      );
    } else {
      // PNG — use Puppeteer screenshot to capture full page including
      // HTML elements (titles, descriptions), backgrounds, and CSS colors
      const screenshot = await page.screenshot({
        type: "png",
        clip: {
          x: 0,
          y: 0,
          width: request.width,
          height: request.height,
        },
      });
      data = Buffer.from(screenshot);
    }

    return {
      data,
      contentType: CONTENT_TYPES[format],
    };
  } finally {
    await releasePage(page);
  }
}
