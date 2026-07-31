import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCreateQuoteUseCase } from "../src/modules/quotes/application/createQuote.usecase.js";
import {
  createQuoteActor,
  createQuoteDraft,
} from "../src/modules/quotes/domain/quoteDraft.js";
import { buildCreateQuoteAction } from "../src/modules/quotes/createQuote.js";

test("create quote preserves dependency order, payloads, and result contract", async () => {
  const calls = [];
  const timestamp = new Date("2026-07-28T12:34:56.000Z");
  const items = [
    { product_id: 41, quantity: 2, discount: 10 },
    { product_id: 42, quantity: 1, discount: 0 },
  ];
  const products = [
    { id: 41, current_price: 100 },
    { id: 42, current_price: 50 },
  ];
  const pricedItems = [
    {
      product_id: 41,
      quantity: 2,
      base_unit_price: 100,
      unit_price: 90,
      discount: 10,
      total: 180,
    },
    {
      product_id: 42,
      quantity: 1,
      base_unit_price: 50,
      unit_price: 50,
      discount: 0,
      total: 50,
    },
  ];
  const pricing = {
    items: pricedItems,
    subtotal: 230,
    iva: 36.8,
    total: 266.8,
  };
  const quoteDraft = {
    client_id: 7,
    contact_id: 8,
    items,
    notes: "Priority quote",
    folio: "ABCD123",
  };
  const actor = { user_id: 9 };

  const createQuoteFromDraft = buildCreateQuoteUseCase({
    quoteRepository: {
      async fetchProductsForQuote(productIds) {
        calls.push({ dependency: "fetchProductsForQuote", input: productIds });
        return products;
      },
      async createQuoteWithItems(payload) {
        calls.push({ dependency: "createQuoteWithItems", input: payload });
        return 501;
      },
    },
    pricingService: {
      calculate(input) {
        calls.push({ dependency: "pricingService.calculate", input });
        return pricing;
      },
    },
    folioService: {
      async resolveQuoteFolio(input) {
        calls.push({ dependency: "resolveQuoteFolio", input });
        return "WXYZ987";
      },
    },
    clock() {
      calls.push({ dependency: "clock" });
      return timestamp;
    },
  });

  const result = await createQuoteFromDraft({ quoteDraft, actor });

  assert.deepEqual(calls, [
    {
      dependency: "fetchProductsForQuote",
      input: [41, 42],
    },
    {
      dependency: "pricingService.calculate",
      input: { items, products },
    },
    {
      dependency: "resolveQuoteFolio",
      input: { explicitFolio: "ABCD123" },
    },
    {
      dependency: "createQuoteWithItems",
      input: {
        folio: "WXYZ987",
        client_id: 7,
        contact_id: 8,
        user_id: 9,
        total: 266.8,
        notes: "Priority quote",
        items: pricedItems,
      },
    },
    { dependency: "clock" },
  ]);
  assert.deepEqual(result, {
    id: 501,
    folio: "WXYZ987",
    client_id: 7,
    user_id: 9,
    total: 266.8,
    subtotal: 230,
    iva: 36.8,
    status: "PENDIENTE",
    is_registered: false,
    notes: "Priority quote",
    created_at: timestamp,
  });
});

test("quote draft preserves defaults and normalizes non-array items", () => {
  assert.deepEqual(createQuoteDraft(), {
    client_id: undefined,
    contact_id: undefined,
    items: [],
    notes: null,
    folio: null,
  });

  assert.deepEqual(
    createQuoteDraft({
      client_id: 12,
      contact_id: 13,
      items: "not-an-array",
      notes: "Keep these notes",
      folio: "QWER123",
    }),
    {
      client_id: 12,
      contact_id: 13,
      items: [],
      notes: "Keep these notes",
      folio: "QWER123",
    },
  );
});

test("quote actor prefers id and falls back to userId", () => {
  assert.deepEqual(createQuoteActor({ id: 21, userId: 22 }), { user_id: 21 });
  assert.deepEqual(createQuoteActor({ userId: 22 }), { user_id: 22 });
  assert.deepEqual(createQuoteActor({ id: 0, userId: 22 }), { user_id: 22 });
  assert.deepEqual(createQuoteActor(), { user_id: undefined });
});

test("create quote action factory maps input and user to the use-case payload", async () => {
  const calls = [];
  const input = { client_id: 7, items: [{ product_id: 41 }] };
  const user = { id: 9 };
  const quoteDraft = { normalized: "quote draft" };
  const actor = { user_id: 9 };
  const pricingService = { calculate() {} };
  const expectedResult = { id: 501 };

  const createQuoteAction = buildCreateQuoteAction({
    createQuoteDraft(receivedInput) {
      calls.push({ dependency: "createQuoteDraft", input: receivedInput });
      return quoteDraft;
    },
    createQuoteActor(receivedUser) {
      calls.push({ dependency: "createQuoteActor", input: receivedUser });
      return actor;
    },
    async createQuoteFromDraft(payload) {
      calls.push({ dependency: "createQuoteFromDraft", input: payload });
      return expectedResult;
    },
    pricingService,
  });

  const result = await createQuoteAction(input, user);

  assert.deepEqual(calls, [
    { dependency: "createQuoteDraft", input },
    { dependency: "createQuoteActor", input: user },
    {
      dependency: "createQuoteFromDraft",
      input: { quoteDraft, actor, pricingService },
    },
  ]);
  assert.equal(result, expectedResult);
});

test("upstream failures propagate without persistence", async (t) => {
  for (const failurePoint of ["products", "pricing", "folio"]) {
    await t.test(failurePoint, async () => {
      const expectedError = new Error(`${failurePoint} failed`);
      let persistenceCalls = 0;
      let clockCalls = 0;

      const createQuoteFromDraft = buildCreateQuoteUseCase({
        quoteRepository: {
          async fetchProductsForQuote() {
            if (failurePoint === "products") throw expectedError;
            return [{ id: 41, current_price: 100 }];
          },
          async createQuoteWithItems() {
            persistenceCalls += 1;
            return 501;
          },
        },
        pricingService: {
          calculate() {
            if (failurePoint === "pricing") throw expectedError;
            return {
              items: [{ product_id: 41 }],
              subtotal: 100,
              iva: 16,
              total: 116,
            };
          },
        },
        folioService: {
          async resolveQuoteFolio() {
            if (failurePoint === "folio") throw expectedError;
            return "WXYZ987";
          },
        },
        clock() {
          clockCalls += 1;
          return new Date();
        },
      });

      await assert.rejects(
        createQuoteFromDraft({
          quoteDraft: {
            client_id: 7,
            contact_id: null,
            items: [{ product_id: 41 }],
            notes: null,
            folio: null,
          },
          actor: { user_id: 9 },
        }),
        (error) => error === expectedError,
      );
      assert.equal(persistenceCalls, 0);
      assert.equal(clockCalls, 0);
    });
  }
});

test("legacy quote creation exports remain compatible", async () => {
  const [quoteModule, legacyAction, quoteDraftDomain, legacyDraftService] =
    await Promise.all([
      import("../src/modules/quotes/createQuote.js"),
      import("../src/graphql/actions/quote_actions/createQuote.action.js"),
      import("../src/modules/quotes/domain/quoteDraft.js"),
      import("../src/services/quoteDraft.service.js"),
    ]);

  assert.equal(legacyAction.createQuoteAction, quoteModule.createQuoteAction);
  assert.equal(
    legacyAction.createQuoteFromDraft,
    quoteModule.createQuoteFromDraft,
  );
  assert.equal(
    legacyDraftService.createQuoteDraft,
    quoteDraftDomain.createQuoteDraft,
  );
  assert.equal(
    legacyDraftService.createQuoteActor,
    quoteDraftDomain.createQuoteActor,
  );
});
