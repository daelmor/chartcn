import puppeteer, { type Browser, type Page } from "puppeteer-core";
import genericPool from "generic-pool";
import type { AppConfig } from "../config.js";

let browser: Browser | null = null;
let pagePool: genericPool.Pool<Page> | null = null;

function findChromiumPath(): string {
  // Check common locations
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ];

  for (const path of candidates) {
    if (path) return path;
  }

  throw new Error(
    "No Chromium binary found. Set CHROMIUM_PATH environment variable."
  );
}

export async function initBrowserPool(config: AppConfig): Promise<void> {
  const chromiumPath = findChromiumPath();

  browser = await puppeteer.launch({
    executablePath: chromiumPath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-extensions",
    ],
  });

  pagePool = genericPool.createPool(
    {
      create: async () => {
        const page = await browser!.newPage();
        await page.setViewport({
          width: 1200,
          height: 900,
          deviceScaleFactor: 2,
        });
        return page;
      },
      destroy: async (page) => {
        await page.close().catch(() => {});
      },
    },
    {
      min: 1,
      max: config.MAX_CONCURRENT_RENDERS,
      acquireTimeoutMillis: config.RENDER_TIMEOUT_MS,
      idleTimeoutMillis: 30000,
    }
  );
}

export async function acquirePage(): Promise<Page> {
  if (!pagePool) throw new Error("Browser pool not initialized");
  return pagePool.acquire();
}

export async function releasePage(page: Page): Promise<void> {
  if (!pagePool) return;
  try {
    await pagePool.release(page);
  } catch {
    // Page may have been destroyed
  }
}

export async function destroyBrowserPool(): Promise<void> {
  if (pagePool) {
    await pagePool.drain();
    await pagePool.clear();
    pagePool = null;
  }
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}
