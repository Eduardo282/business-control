import { test } from "node:test";
import assert from "node:assert/strict";

import {
  generateQuoteFolioCandidate,
  resolveQuoteFolio,
} from "../src/graphql/actions/quote_actions/quoteFolio.js";

test("generateQuoteFolioCandidate creates a quote-only folio format", () => {
  const folio = generateQuoteFolioCandidate();

  assert.match(folio, /^[A-Z]{4}\d{3}$/);
});

test("resolveQuoteFolio keeps a valid explicit quote folio when unique", async () => {
  const queryRunner = {
    query: async (_query, params) => {
      assert.equal(params[0], "ABCD123");
      return [[]];
    },
  };

  const folio = await resolveQuoteFolio({
    explicitFolio: "  abcd123  ",
    queryRunner,
  });

  assert.equal(folio, "ABCD123");
});

test("resolveQuoteFolio does not use product folio values", async () => {
  const queryRunner = {
    query: async () => [[]],
  };

  const folio = await resolveQuoteFolio({
    explicitFolio: "PRD-000001",
    queryRunner,
  });

  assert.match(folio, /^[A-Z]{4}\d{3}$/);
  assert.notEqual(folio, "PRD-000001");
});
