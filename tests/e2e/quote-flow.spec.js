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

    // 1. Hacemos clic en Iniciar Sesión
    await page.getByRole('button', { name: /Iniciar/i }).click();

    // 2. Esperamos a que el campo de "Correo electrónico" desaparezca. 
    // Esto es único del Login y no viola el Strict Mode.
    await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 10000 });
    
    // Opcional: Espera a que un elemento de la nueva pantalla sea visible
    // await expect(page.getByRole('button', { name: /Cerrar sesión/i })).toBeVisible();

    // Debug: Verifica si el token se guardó en el navegador
    const token = await page.evaluate(() => localStorage.getItem('bc_token'));
    console.log("Token encontrado en el navegador:", token);

    await page.goto(`${baseUrl}/cotizaciones/nueva`);
    await expect(page).toHaveURL(/\/cotizaciones\/nueva/);
    await expect(page.getByText(/cliente/i)).toBeVisible();
  });
});
