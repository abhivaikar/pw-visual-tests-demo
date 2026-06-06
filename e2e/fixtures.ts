import { test as base, expect } from '@playwright/test';

/**
 * Visual-variant fixture.
 *
 * When the suite runs in variant mode — which playwright.variant.config.ts
 * signals by setting the PW_VARIANT env var — this fixture transparently
 * appends `?variant=<value>` to every page.goto() call. The app then renders
 * its "v2" (changed) state, so the same unmodified specs compare the changed UI
 * against the v1 baselines and surface realistic visual regressions.
 *
 * In the base config PW_VARIANT is unset, so this is a pure pass-through and the
 * app renders its v1 (baseline) state. Existing query params are preserved.
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const variant = process.env.PW_VARIANT;
    if (variant) {
      const originalGoto = page.goto.bind(page);
      page.goto = ((url: string, options?: Parameters<typeof originalGoto>[1]) => {
        const resolved = new URL(url, baseURL ?? 'http://localhost:3000');
        resolved.searchParams.set('variant', variant);
        return originalGoto(resolved.toString(), options);
      }) as typeof page.goto;
    }
    await use(page);
  },
});

export { expect };
