import { expect } from "@playwright/test";

const apiUrl =
  process.env.E2E_API_URL ||
  process.env.VITE_API_URL ||
  "http://127.0.0.1:4000/graphql";

export async function authenticateAdmin(page, request, { email, password }) {
  const response = await request.post(apiUrl, {
    data: {
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user { id full_name email role { id name } }
          }
        }
      `,
      variables: { input: { email, password } },
    },
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join("; "));
  }

  const { token, user } = body.data.login;
  await page.addInitScript((authToken) => {
    globalThis.localStorage.setItem("bc_token", authToken);
  }, token);

  return { token, user };
}
