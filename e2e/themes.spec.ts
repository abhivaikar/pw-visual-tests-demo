import { test, expect } from './fixtures';

/**
 * Themes page — visual consistency across light and dark variants.
 *
 * Demonstrates:
 *  - expect(page).toHaveScreenshot()      (the full side-by-side comparison)
 *  - expect(locator).toHaveScreenshot()   (each theme pane independently)
 */
test.describe('themes page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/themes');
  });

  test('light and dark side by side — full page', async ({ page }) => {
    await expect(page).toHaveScreenshot('themes-full.png');
  });

  test('light pane — element screenshot', async ({ page }) => {
    const light = page.getByTestId('pane-light');
    await expect(light).toHaveScreenshot('theme-light.png');
  });

  test('dark pane — element screenshot', async ({ page }) => {
    const dark = page.getByTestId('pane-dark');
    await expect(dark).toHaveScreenshot('theme-dark.png');
  });
});
