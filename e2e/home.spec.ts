import { test, expect } from './fixtures';

/**
 * Home page — straightforward full-page baselines.
 *
 * Demonstrates:
 *  - expect(page).toHaveScreenshot()            (unnamed)
 *  - expect(page).toHaveScreenshot('name.png')  (named)
 *  - expect(page).toHaveScreenshot({ fullPage }) (whole scrollable document)
 */
test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('full page — unnamed screenshot', async ({ page }) => {
    // Unnamed: Playwright derives the file name from the test title.
    await expect(page).toHaveScreenshot();
  });

  test('full page — named screenshot', async ({ page }) => {
    // Named: the file name is supplied explicitly.
    await expect(page).toHaveScreenshot('home-named.png');
  });

  test('full page — fullPage screenshot', async ({ page }) => {
    // Capture the entire scrollable document, not just the viewport.
    await expect(page).toHaveScreenshot('home-fullpage.png', {
      fullPage: true,
    });
  });
});
