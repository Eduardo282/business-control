import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";
const apiUrl = process.env.E2E_API_URL || "http://127.0.0.1:4000/graphql";
const adminEmail = process.env.E2E_ADMIN_EMAIL || "admin@businesscontrol.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "Admin123*";
const portalEmail = process.env.E2E_PORTAL_EMAIL || "portal-contact@businesscontrol.test";
const portalPassword = process.env.E2E_PORTAL_PASSWORD || "Password123*";

async function gql(request, { query, variables, token }) {
  const response = await request.post(apiUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    data: { query, variables },
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join("; "));
  }
  return body.data;
}

test.describe("real product → quote → contact portal flow", () => {
  test.skip(process.env.E2E_REAL_FLOW !== "true", "Set E2E_REAL_FLOW=true or run pnpm run test:e2e:real");

  test("quote stays hidden until registration and then appears in the portal UI", async ({ page, request }) => {
    const suffix = Date.now();
    const productName = `E2E Portal Service ${suffix}`;

    const loginData = await gql(request, {
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user { id }
          }
        }
      `,
      variables: { input: { email: adminEmail, password: adminPassword } },
    });
    const adminToken = loginData.login.token;

    const productData = await gql(request, {
      token: adminToken,
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            folio
            name
            product_type
          }
        }
      `,
      variables: {
        input: {
          name: productName,
          category: "E2E Services",
          price: 333.33,
          users_count: 10,
          description: "Created by real Playwright flow",
          product_type: "SERVICE",
        },
      },
    });
    const product = productData.createProduct;
    expect(product.folio).toMatch(/^SRV-\d{6}$/);

    const seededData = await gql(request, {
      token: adminToken,
      query: `
        query SeededClient {
          clients(limit: 5, offset: 0) {
            id
            business_name
            contacts {
              id
              email
            }
          }
        }
      `,
    });
    const seededClient = seededData.clients.find((client) =>
      client.contacts.some((contact) => contact.email === portalEmail),
    );
    expect(seededClient).toBeTruthy();
    const seededContact = seededClient.contacts.find((contact) => contact.email === portalEmail);

    const quoteData = await gql(request, {
      token: adminToken,
      query: `
        mutation CreateQuote($input: CreateQuoteInput!) {
          createQuote(input: $input) {
            id
            folio
            is_registered
            is_sent_to_client_portal
            items {
              product { folio name }
            }
          }
        }
      `,
      variables: {
        input: {
          client_id: seededClient.id,
          contact_id: seededContact.id,
          notes: "Real E2E quote should appear only after registration",
          items: [{ product_id: product.id, quantity: 1, discount: 0 }],
        },
      },
    });
    const quote = quoteData.createQuote;
    expect(quote.folio).toMatch(/^[A-Z]{4}\d{3}$/);
    expect(quote.folio).not.toBe(product.folio);
    expect(quote.is_registered).toBe(false);

    const portalLoginData = await gql(request, {
      query: `
        mutation LoginContact($email: String!, $password: String!) {
          loginContact(email: $email, password: $password) {
            token
          }
        }
      `,
      variables: { email: portalEmail, password: portalPassword },
    });

    const hiddenPortalData = await gql(request, {
      token: portalLoginData.loginContact.token,
      query: `
        query PortalQuotesBeforeRegistration {
          quotes { id folio }
        }
      `,
    });
    expect(hiddenPortalData.quotes.some((portalQuote) => portalQuote.id === quote.id)).toBe(false);

    const registeredData = await gql(request, {
      token: adminToken,
      query: `
        mutation RegisterQuote($id: ID!) {
          registerQuote(id: $id) {
            id
            folio
            is_registered
            is_sent_to_client_portal
          }
        }
      `,
      variables: { id: quote.id },
    });
    expect(registeredData.registerQuote.is_registered).toBe(true);
    expect(registeredData.registerQuote.is_sent_to_client_portal).toBe(true);

    await page.goto(`${baseUrl}/portal/login`);
    await page.locator('input[type="email"]').fill(portalEmail);
    await page.locator('input[type="password"]').fill(portalPassword);
    await Promise.all([
      page.waitForURL("**/portal/dashboard"),
      page.getByRole("button", { name: /Acceder al Portal/i }).click(),
    ]);

    await page.goto(`${baseUrl}/portal/quotes?filter=recent`);
    await expect(page.getByText(quote.folio)).toBeVisible({ timeout: 10_000 });

    await page.goto(`${baseUrl}/portal/quotes/${quote.id}`);
    await expect(page.getByRole("heading", { name: new RegExp(`Cotizaci.n ${quote.folio}`) })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText(product.folio, { exact: true })).toBeVisible();
  });
});
