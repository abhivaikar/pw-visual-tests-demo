import { test, expect } from './fixtures';
import path from 'path';

/**
 * Dynamic page — the volatile-content scenarios.
 *
 * Demonstrates:
 *  - toHaveScreenshot({ mask })                 (hide timestamp + avatar)
 *  - toHaveScreenshot({ stylePath })            (inject CSS to hide volatiles)
 *  - toHaveScreenshot({ omitBackground: true }) (transparent backdrop)
 */
test.describe('dynamic page', () => {
  test.beforeEach(async ({ page }) => {
    // Fixed seed so the avatar is deterministic in everything but the mask test.
    await page.goto('/dynamic?seed=ada');
  });

  test('mask volatile elements (timestamp + avatar)', async ({ page }) => {
    // The timestamp ticks every second and the avatar varies per user; mask
    // both so the rest of the page can still be compared.
    await expect(page).toHaveScreenshot('dynamic-masked.png', {
      mask: [page.getByTestId('timestamp'), page.getByTestId('avatar')],
      // Customise the mask colour (optional) to make the demo obvious.
      maskColor: '#ff00ff',
    });
  });

  test('stylePath — inject CSS to hide volatile elements', async ({ page }) => {
    // Instead of masking, inject a stylesheet that hides the volatile bits.
    await expect(page).toHaveScreenshot('dynamic-stylepath.png', {
      stylePath: path.join(__dirname, 'hide-dynamic.css'),
    });
  });

  test('omitBackground — transparent backdrop on element', async ({ page }) => {
    // omitBackground removes the default white backdrop so anything the page
    // does not paint is captured as transparent (visible in the PNG alpha).
    // Targets the avatar — a static, fixed-size element — so this stays a clean
    // API demonstration rather than participating in the variant diff.
    const avatar = page.getByTestId('avatar');
    await expect(avatar).toHaveScreenshot('avatar-omit-bg.png', {
      omitBackground: true,
    });
  });
});
