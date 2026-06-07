import { test, expect } from "@playwright/test";
import { authenticateAdmin } from "./auth.js";

const baseUrl = process.env.E2E_BASE_URL;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const canRun = Boolean(baseUrl && adminEmail && adminPassword);
const canWriteProducts = process.env.E2E_REGISTER_PRODUCTS === "true";

test.describe("product registration flow", () => {
  test.skip(!canRun, "E2E env not configured");
  test.skip(!canWriteProducts, "Set E2E_REGISTER_PRODUCTS=true to run write E2E");

  test("admin registers a service and sees it in the product catalog", async ({ page, request }) => {
    const suffix = Date.now();
    const categoryName = `QA Servicios ${suffix}`;
    const serviceName = `QA Servicio ${suffix}`;

    await authenticateAdmin(page, request, { email: adminEmail, password: adminPassword });
    await page.goto(`${baseUrl}/registrar-productos`);

    await page.getByRole("button", { name: /Gestionar categorías/i }).click();
    await page.getByPlaceholder("Ej. Contabilidad", { exact: true }).fill(categoryName);
    await page.getByRole("button", { name: /^Agregar$/i }).click();
    await page.getByRole("button", { name: categoryName }).click();

    await page.getByText(/Seleccionar o agregar productos o servicios/i).click();
    await page.getByRole("button", { name: /Servicios/i }).click();
    await page.getByRole("button", { name: /Nuevo servicio/i }).click();

    await page.locator("#register-product-name-input").fill(serviceName);
    await page.locator("#register-price-input").fill("1499.99");
    await page.getByPlaceholder(/Detalles técnicos/i).fill("Servicio creado por prueba E2E");

    await page.getByRole("button", { name: /Registrar Servicio/i }).click();
    await expect(page.getByText(/Servicio registrado/i)).toBeVisible({ timeout: 10_000 });

    await page.goto(`${baseUrl}/productos`);
    await page.getByPlaceholder(/Buscar por folio, nombre, categoría/i).fill(serviceName);

    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(categoryName)).toBeVisible();
    await expect(page.getByText(/SRV-\d{6}/)).toBeVisible();
  });
});
