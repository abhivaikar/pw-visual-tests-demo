import { test, expect } from './fixtures';

/**
 * Components page — element-level screenshots and several option flags.
 *
 * Demonstrates:
 *  - expect(locator).toHaveScreenshot()                  (per component)
 *  - toHaveScreenshot({ maxDiffPixels })                 (absolute pixel budget)
 *  - toHaveScreenshot({ maxDiffPixelRatio })             (ratio-based budget)
 *  - toHaveScreenshot({ threshold })                     (per-pixel sensitivity)
 *  - toHaveScreenshot({ clip })                          (bounding-box region)
 *  - toHaveScreenshot({ scale: 'css' | 'device' })       (DPR handling)
 */
test.describe('components page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components');
  });

  test('buttons component — element screenshot', async ({ page }) => {
    const buttons = page.getByTestId('buttons');
    await expect(buttons).toHaveScreenshot('buttons.png');
  });

  test('cards component — element screenshot', async ({ page }) => {
    const cards = page.getByTestId('cards');
    await expect(cards).toHaveScreenshot('cards.png');
  });

  test('badges component with maxDiffPixels', async ({ page }) => {
    const badges = page.getByTestId('badges');
    // Allow up to 100 differing pixels before the comparison fails.
    await expect(badges).toHaveScreenshot('badges.png', {
      maxDiffPixels: 100,
    });
  });

  test('inputs component with maxDiffPixelRatio', async ({ page }) => {
    const inputs = page.getByTestId('inputs');
    // Allow up to 1% of pixels to differ.
    await expect(inputs).toHaveScreenshot('inputs.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('alerts component with custom threshold', async ({ page }) => {
    const alerts = page.getByTestId('alerts');
    // Tighter per-pixel colour sensitivity than the config default (0.2).
    await expect(alerts).toHaveScreenshot('alerts.png', {
      threshold: 0.1,
    });
  });

  test('clip — capture a specific region by bounding box', async ({ page }) => {
    // Clip is relative to the page, so screenshot the page with a clip rect
    // sized to the buttons section.
    const box = await page.locator('#buttons-section').boundingBox();
    if (!box) throw new Error('buttons-section not found');
    await expect(page).toHaveScreenshot('clip-region.png', {
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
    });
  });

  test('scale: css — device-independent pixels', async ({ page }) => {
    const cards = page.getByTestId('cards');
    await expect(cards).toHaveScreenshot('cards-scale-css.png', {
      scale: 'css',
    });
  });

  test('scale: device — physical device pixels', async ({ page }) => {
    const cards = page.getByTestId('cards');
    await expect(cards).toHaveScreenshot('cards-scale-device.png', {
      scale: 'device',
    });
  });
});
