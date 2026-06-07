import { test, expect } from "@playwright/test";
import { authenticateAdmin } from "./auth.js";

const baseUrl = process.env.E2E_BASE_URL;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const hasCreds = Boolean(baseUrl && adminEmail && adminPassword);

test.describe("quote flow", () => {
  test.skip(!hasCreds, "E2E env not configured");

  test("admin can reach create quote page", async ({ page, request }) => {
    await authenticateAdmin(page, request, { email: adminEmail, password: adminPassword });
    await page.goto(`${baseUrl}/cotizaciones/nueva`);
    await expect(page).toHaveURL(/\/cotizaciones\/nueva/);
    await expect(page.getByRole("heading", { name: /Datos del Cliente/i })).toBeVisible();
  });
});
