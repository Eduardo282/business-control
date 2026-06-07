import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const hasCreds = Boolean(baseUrl && adminEmail && adminPassword);

test.describe("quote flow", () => {
  test.skip(!hasCreds, "E2E env not configured");

  test("admin can reach create quote page", async ({ page }) => {
    await page.goto(`${baseUrl}/login`);

    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(adminPassword);

    await Promise.all([
      // Espera explícitamente a que la URL cambie a la raíz o al dashboard
      page.waitForURL(/\/$/), 
      page.getByRole('button', { name: /Iniciar/i }).click(),
    ]);

    // Debug: Verifica si el token se guardó en el navegador
    const token = await page.evaluate(() => localStorage.getItem('bc_token'));
    console.log("Token encontrado en el navegador:", token);

    await page.goto(`${baseUrl}/cotizaciones/nueva`);
    await expect(page).toHaveURL(/\/cotizaciones\/nueva/);
    await expect(page.getByText(/cliente/i)).toBeVisible();
  });
});
