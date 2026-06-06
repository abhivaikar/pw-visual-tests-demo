import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for pw-visual-tests-demo.
 *
 * This config exercises Playwright's visual regression APIs and acts as the
 * testing surface for the `pw-ui-review` tool.
 *
 * Project layout
 * --------------
 *  A single project: standard desktop Chromium at 1280x720. The whole suite
 *  runs against this one browser/viewport — no cross-browser, no extra sizes.
 */
export default defineConfig({
  testDir: './e2e',

  // Baselines live here (explicitly configured, tracked via Git LFS).
  snapshotDir: './snapshots',

  // Stable, descriptive snapshot paths grouped by spec, project and platform.
  snapshotPathTemplate:
    '{snapshotDir}/{testFileName}/{arg}-{projectName}-{platform}{ext}',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    // Trace is captured for every test (not just failures) so pw-ui-review
    // always has a trace to inspect.
    trace: 'on',
  },

  // Config-level defaults for every toHaveScreenshot() / toMatchSnapshot() call.
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      // Base per-pixel colour sensitivity. Individual tests override this.
      threshold: 0.2,
    },
    toMatchSnapshot: {
      threshold: 0.2,
    },
  },

  projects: [
    // Single project: standard desktop Chromium at 1280x720.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],

  // NOTE: Playwright does NOT manage the app server. Start it yourself with
  // `npm start` (http://localhost:3000) before running the suite.
});
