import { test, expect } from './fixtures';

/**
 * States page — multiple snapshots within a single test.
 *
 * Demonstrates:
 *  - several expect(page).toHaveScreenshot() calls in one test, one per state
 *  - navigating directly to each state via the ?state= URL parameter
 */
test.describe('states page', () => {
  test('snapshot every form state in one test', async ({ page }) => {
    const states = ['empty', 'filled', 'error', 'success'] as const;

    for (const state of states) {
      await page.goto(`/states?state=${state}`);
      // Scope to the form so unrelated layout never affects the comparison.
      const form = page.getByTestId('signup-form');
      await expect(form).toHaveScreenshot(`state-${state}.png`);
    }
  });
});
