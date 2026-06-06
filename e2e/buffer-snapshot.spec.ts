import { test, expect } from './fixtures';

/**
 * Buffer-based snapshot API.
 *
 * Demonstrates:
 *  - page.screenshot() to obtain a raw Buffer
 *  - expect(buffer).toMatchSnapshot('name.png') to compare it manually
 *
 * This is the lower-level alternative to toHaveScreenshot(): you control when
 * and how the bytes are produced, then compare them against a stored baseline.
 */
test.describe('buffer snapshot', () => {
  test('page.screenshot() compared via toMatchSnapshot', async ({ page }) => {
    await page.goto('/');
    const buffer = await page.screenshot({ animations: 'disabled' });
    expect(buffer).toMatchSnapshot('home-buffer.png');
  });

  test('element buffer compared via toMatchSnapshot', async ({ page }) => {
    await page.goto('/components');
    const buffer = await page
      .getByTestId('buttons')
      .screenshot({ animations: 'disabled' });
    expect(buffer).toMatchSnapshot('buttons-buffer.png');
  });

  test('fullPage buffer compared via toMatchSnapshot', async ({ page }) => {
    await page.goto('/slow');
    await page.getByTestId('slow-content').waitFor({ state: 'visible' });
    const buffer = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
    });
    expect(buffer).toMatchSnapshot('slow-buffer.png');
  });
});
