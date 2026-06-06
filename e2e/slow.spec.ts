import { test, expect } from './fixtures';

/**
 * Slow page — waiting strategies and fullPage capture.
 *
 * Demonstrates:
 *  - page.waitForSelector(...) before snapshotting
 *  - locator.waitFor({ state: 'visible' }) as the modern equivalent
 *  - page.waitForTimeout(...) as a (discouraged) fixed wait
 *  - toHaveScreenshot({ fullPage: true }) on scrollable content
 */
test.describe('slow page', () => {
  test('waitForSelector before snapshot', async ({ page }) => {
    await page.goto('/slow');
    // Wait for the delayed content to be attached + visible, then snapshot.
    await page.waitForSelector('[data-testid="ready-banner"]', {
      state: 'visible',
    });
    await expect(page.getByTestId('ready-banner')).toHaveScreenshot(
      'slow-ready-banner.png'
    );
  });

  test('locator.waitFor then fullPage screenshot', async ({ page }) => {
    await page.goto('/slow');
    // Modern waiting: wait on the locator itself.
    await page.getByTestId('slow-content').waitFor({ state: 'visible' });
    // fullPage captures the entire scrollable document, not just the viewport.
    await expect(page).toHaveScreenshot('slow-fullpage.png', {
      fullPage: true,
    });
  });

  test('waitForTimeout as a fixed wait', async ({ page }) => {
    await page.goto('/slow');
    // Fixed wait longer than the page's 1.5s reveal delay. Generally
    // discouraged in favour of waitForSelector, but shown here for coverage.
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('slow-content')).toHaveScreenshot(
      'slow-content.png'
    );
  });
});
