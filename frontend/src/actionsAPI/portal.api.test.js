import { beforeEach, describe, expect, it, vi } from "vitest";

const { gqlMock } = vi.hoisted(() => ({
  gqlMock: vi.fn(),
}));

vi.mock("../utils/graphqlClient", () => ({
  gql: gqlMock,
}));

vi.mock("./portalAxiosClient", () => ({
  portalAxiosClient: { post: vi.fn() },
}));

import {
  acceptPortalQuoteApi,
  deletePortalContactProductApi,
  getContactDataApi,
  listPortalQuotesApi,
  rejectPortalQuoteApi,
  requestQuoteApi,
} from "./portal.api.js";

describe("listPortalQuotesApi", () => {
  beforeEach(() => {
    gqlMock.mockReset();
  });

  it("requests the registration state used by the portal status column", async () => {
    gqlMock.mockResolvedValue({ quotes: [] });

    await listPortalQuotesApi();

    const [query] = gqlMock.mock.calls[0];
    expect(query).toMatch(/\bis_registered\b/);
  });
});

describe("getContactDataApi", () => {
  beforeEach(() => {
    gqlMock.mockReset();
  });

  it("requests the active service type shown in the portal cards", async () => {
    gqlMock.mockResolvedValue({ contact: { id: "1", active_services: [] } });

    await getContactDataApi("1");

    const [query] = gqlMock.mock.calls[0];
    expect(query).toMatch(/\bactive_services\b/);
    expect(query).toMatch(/\bproduct_type\b/);
  });
});

describe("deletePortalContactProductApi", () => {
  beforeEach(() => {
    gqlMock.mockReset();
  });

  it("deletes a contact-owned service or policy from the portal", async () => {
    gqlMock.mockResolvedValue({ deletePortalContactProduct: true });

    await expect(deletePortalContactProductApi("12")).resolves.toBe(true);

    const [query, variables] = gqlMock.mock.calls[0];
    expect(query).toMatch(/mutation DeletePortalContactProduct/);
    expect(query).toMatch(/\bdeletePortalContactProduct\b/);
    expect(variables).toEqual({ id: "12" });
  });
});

describe("requestQuoteApi", () => {
  beforeEach(() => {
    gqlMock.mockReset();
  });

  it("sends all selected portal products in one quote request", async () => {
    gqlMock.mockResolvedValue({
      requestQuote: { id: "90", folio: "REQA123", status: "SOLICITADA" },
    });

    const items = [
      { product_id: "prd-1", quantity: 3 },
      { product_id: "prd-2", quantity: 1 },
    ];

    await expect(requestQuoteApi(items)).resolves.toEqual({
      id: "90",
      folio: "REQA123",
      status: "SOLICITADA",
    });

    const [query, variables] = gqlMock.mock.calls[0];
    expect(query).toMatch(/mutation RequestQuote/);
    expect(variables).toEqual({ input: { items } });
  });
});

describe("portal quote decisions", () => {
  beforeEach(() => {
    gqlMock.mockReset();
  });

  it("accepts a quote from the contact portal", async () => {
    gqlMock.mockResolvedValue({ acceptPortalQuote: true });

    await expect(acceptPortalQuoteApi("42")).resolves.toBe(true);

    const [query, variables] = gqlMock.mock.calls[0];
    expect(query).toMatch(/mutation AcceptPortalQuote/);
    expect(query).toMatch(/\bacceptPortalQuote\b/);
    expect(variables).toEqual({ id: "42" });
  });

  it("rejects a quote from the contact portal", async () => {
    gqlMock.mockResolvedValue({ rejectPortalQuote: true });

    await expect(rejectPortalQuoteApi("42")).resolves.toBe(true);

    const [query, variables] = gqlMock.mock.calls[0];
    expect(query).toMatch(/mutation RejectPortalQuote/);
    expect(query).toMatch(/\brejectPortalQuote\b/);
    expect(variables).toEqual({ id: "42" });
  });
});
