// @ts-check
import { test, expect } from '@playwright/test';

const baseUrl = process.env.E2E_BASE_URL;
const hasBaseUrl = Boolean(baseUrl);

test.describe('login smoke', () => {
  test.skip(!hasBaseUrl, 'E2E_BASE_URL not configured');

  test('login page loads', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Iniciar/i })).toBeVisible();
  });
});
