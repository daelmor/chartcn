import puppeteer, { type Browser, type Page } from "puppeteer-core";
import genericPool from "generic-pool";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AppConfig } from "../config.js";

let browser: Browser | null = null;
let pagePool: genericPool.Pool<Page> | null = null;

function findPuppeteerChrome(): string | undefined {
  // npx puppeteer browsers install chrome puts it under ~/.cache/puppeteer/chrome/
  const cacheDir = join(homedir(), ".cache", "puppeteer", "chrome");
  try {
    const versions = readdirSync(cacheDir);
    for (const ver of versions.sort().reverse()) {
      const candidates = [
        join(cacheDir, ver, "chrome-linux64", "chrome"),
        join(cacheDir, ver, "chrome-linux", "chrome"),
      ];
      for (const c of candidates) {
        if (existsSync(c)) return c;
      }
    }
  } catch {
    // directory doesn't exist
  }
  return undefined;
}

function findChromiumPath(): string {
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    findPuppeteerChrome(),
  ];

  for (const p of candidates) {
    if (p && existsSync(p)) return p;
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
