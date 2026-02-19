#!/usr/bin/env npx tsx
/**
 * Generates an HTML comparison grid showing all rendered test charts.
 *
 * Usage:
 *   npx tsx scripts/visual-qa/generate-grid.ts
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { testCharts } from "./test-charts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../../test-output");
const GOLDEN_DIR = resolve(OUTPUT_DIR, "golden");
const DIFF_DIR = resolve(OUTPUT_DIR, "diffs");

interface ComparisonResult {
  name: string;
  status: "pass" | "changed" | "new" | "error";
  diffPercent: number;
  message: string;
}

function imgToDataUrl(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  const buf = readFileSync(filePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function main() {
  const pngs = readdirSync(OUTPUT_DIR).filter(
    (f) => f.endsWith(".png") && !f.endsWith("-diff.png")
  );

  if (pngs.length === 0) {
    console.error("No rendered PNGs found. Run render-test-charts.ts first.");
    process.exit(1);
  }

  // Load comparison results if available
  let results: ComparisonResult[] = [];
  const resultsPath = resolve(OUTPUT_DIR, "comparison-results.json");
  if (existsSync(resultsPath)) {
    results = JSON.parse(readFileSync(resultsPath, "utf-8"));
  }
  const resultMap = new Map(results.map((r) => [r.name, r]));

  // Build chart info map
  const chartMap = new Map(testCharts.map((c) => [c.name, c]));

  // Generate HTML
  const cards = pngs
    .map((file) => {
      const name = file.replace(".png", "");
      const chart = chartMap.get(name);
      const result = resultMap.get(name);
      const currentImg = imgToDataUrl(resolve(OUTPUT_DIR, file));
      const goldenImg = imgToDataUrl(resolve(GOLDEN_DIR, file));
      const diffImg = imgToDataUrl(resolve(DIFF_DIR, `${name}-diff.png`));

      const statusClass = result
        ? result.status === "pass" ? "pass" : result.status === "changed" ? "changed" : result.status === "new" ? "new" : "error"
        : "unknown";
      const statusLabel = result
        ? `${result.status.toUpperCase()} (${result.diffPercent >= 0 ? result.diffPercent.toFixed(2) + "%" : "N/A"})`
        : "No comparison";

      return `
        <div class="card ${statusClass}">
          <div class="card-header">
            <span class="badge ${statusClass}">${statusClass}</span>
            <h3>${name}</h3>
            <p>${chart?.description ?? ""}</p>
            <small>${statusLabel}</small>
          </div>
          <div class="images">
            <div class="img-col">
              <label>Current</label>
              ${currentImg ? `<img src="${currentImg}" alt="${name}">` : "<p>Missing</p>"}
            </div>
            ${goldenImg ? `
            <div class="img-col">
              <label>Golden</label>
              <img src="${goldenImg}" alt="${name} golden">
            </div>` : ""}
            ${diffImg ? `
            <div class="img-col">
              <label>Diff</label>
              <img src="${diffImg}" alt="${name} diff">
            </div>` : ""}
          </div>
        </div>`;
    })
    .join("\n");

  const passCount = results.filter((r) => r.status === "pass").length;
  const changedCount = results.filter((r) => r.status === "changed").length;
  const newCount = results.filter((r) => r.status === "new").length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>chartcn Visual QA Grid</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f5f5f5;
    color: #111;
    padding: 24px;
  }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .summary {
    color: #666; font-size: 14px; margin-bottom: 24px;
  }
  .summary span { font-weight: 600; }
  .summary .pass-count { color: #16a34a; }
  .summary .changed-count { color: #ea580c; }
  .summary .new-count { color: #2563eb; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 16px;
  }
  .card {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    overflow: hidden;
  }
  .card.pass { border-left: 4px solid #16a34a; }
  .card.changed { border-left: 4px solid #ea580c; }
  .card.new { border-left: 4px solid #2563eb; }
  .card.error { border-left: 4px solid #dc2626; }
  .card.unknown { border-left: 4px solid #a3a3a3; }
  .card-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }
  .card-header h3 { font-size: 14px; font-weight: 600; margin: 4px 0 2px; }
  .card-header p { font-size: 12px; color: #666; }
  .card-header small { font-size: 11px; color: #999; }
  .badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    color: #fff;
  }
  .badge.pass { background: #16a34a; }
  .badge.changed { background: #ea580c; }
  .badge.new { background: #2563eb; }
  .badge.error { background: #dc2626; }
  .badge.unknown { background: #a3a3a3; }
  .images {
    display: flex;
    gap: 4px;
    padding: 8px;
    overflow-x: auto;
  }
  .img-col {
    flex: 1;
    min-width: 0;
    text-align: center;
  }
  .img-col label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .img-col img {
    width: 100%;
    height: auto;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    background: #fff;
  }
</style>
</head>
<body>
<h1>chartcn Visual QA Grid</h1>
<div class="summary">
  ${pngs.length} charts rendered.
  ${results.length > 0
    ? `<span class="pass-count">${passCount} passed</span> · <span class="changed-count">${changedCount} changed</span> · <span class="new-count">${newCount} new</span>`
    : "No golden comparison available — run compare-golden.ts first."}
</div>
<div class="grid">
${cards}
</div>
</body>
</html>`;

  const outPath = resolve(OUTPUT_DIR, "grid.html");
  writeFileSync(outPath, html);
  console.log(`Grid generated: ${outPath}`);
  console.log(`${pngs.length} charts included`);
}

main();
