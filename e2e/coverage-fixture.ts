import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test as baseTest, type BrowserContext } from "@playwright/test";

const istanbulOutputDirectory = join(process.cwd(), ".nyc_output");

type IstanbulWindow = Window & {
  __coverage__?: unknown;
  collectIstanbulCoverage(coverage?: string): void;
};

function persistIstanbulCoverage(coverage?: string) {
  if (!coverage) return;

  mkdirSync(istanbulOutputDirectory, { recursive: true });
  const identifier = randomBytes(16).toString("hex");
  writeFileSync(join(istanbulOutputDirectory, `playwright_coverage_${identifier}.json`), coverage);
}

export async function enableIstanbulCoverage(context: BrowserContext) {
  await context.exposeFunction("collectIstanbulCoverage", persistIstanbulCoverage);
  await context.addInitScript(() => {
    window.addEventListener("beforeunload", () => {
      const coverageWindow = window as unknown as IstanbulWindow;
      coverageWindow.collectIstanbulCoverage(JSON.stringify(coverageWindow.__coverage__));
    });
  });
}

export async function collectIstanbulCoverage(context: BrowserContext) {
  await Promise.all(
    context.pages().map((page) =>
      page
        .evaluate(async () => {
          const coverageWindow = window as unknown as IstanbulWindow;
          const timeoutAt = Date.now() + 5_000;

          while (!coverageWindow.__coverage__ && Date.now() < timeoutAt) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          if (coverageWindow.__coverage__) {
            coverageWindow.collectIstanbulCoverage(JSON.stringify(coverageWindow.__coverage__));
          }
        })
        .catch(() => undefined),
    ),
  );
}

export const test = baseTest.extend({
  context: async ({ context }, use) => {
    await enableIstanbulCoverage(context);
    await use(context);
    await collectIstanbulCoverage(context);
  },
});

export const expect = test.expect;
