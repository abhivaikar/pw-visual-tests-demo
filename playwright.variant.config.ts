import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Variant config — identical to playwright.config.ts in every respect
 * (snapshotDir, project, reporters, expect defaults), so screenshots
 * are written to and compared against the SAME v1 baselines.
 *
 * The only difference: it sets PW_VARIANT=v2, which the fixture in
 * e2e/fixtures.ts reads to append ?variant=v2 to every navigation. Running this
 * config after generating v1 baselines surfaces the app's v2 visual changes as
 * regression failures. No spec file changes behaviour between the two configs.
 */
process.env.PW_VARIANT = 'v2';

export default defineConfig({
  ...baseConfig,
});
