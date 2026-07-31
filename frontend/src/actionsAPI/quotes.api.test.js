import { beforeEach, describe, expect, it, vi } from "vitest";

const { gqlMock } = vi.hoisted(() => ({
  gqlMock: vi.fn(),
}));

vi.mock("../utils/graphqlClient", () => ({
  gql: gqlMock,
}));

import {
  getQuoteApi,
  listQuotesApi,
  sendQuoteEmailApi,
} from "./quotes.api.js";

describe("listQuotesApi", () => {
  beforeEach(() => {
    gqlMock.mockReset();
  });

  it("requests the item discount used by the sale detail", async () => {
    gqlMock.mockResolvedValue({ quotes: [] });

    await listQuotesApi();

    const [query] = gqlMock.mock.calls[0];
    expect(query).toMatch(/items\s*{[\s\S]*\bdiscount\b[\s\S]*}/);
  });

  it("requests the persisted email delivery timestamp", async () => {
    gqlMock.mockResolvedValue({ quote: { id: "42" } });

    await getQuoteApi("42");

    const [query] = gqlMock.mock.calls[0];
    expect(query).toMatch(/\bemail_sent_at\b/);
  });

  it("returns the persisted email delivery timestamp after sending", async () => {
    gqlMock.mockResolvedValue({
      sendQuoteEmail: {
        success: true,
        message: "Correo enviado correctamente.",
        email_sent_at: "2026-06-14T00:00:00.000Z",
      },
    });

    const result = await sendQuoteEmailApi({
      quote_id: "42",
      contact_email: "contact@example.com",
      message: "Cotización adjunta",
    });

    const [query] = gqlMock.mock.calls[0];
    expect(query).toMatch(/\bemail_sent_at\b/);
    expect(result.email_sent_at).toBe("2026-06-14T00:00:00.000Z");
  });
});
