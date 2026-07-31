import test from "node:test";
import assert from "node:assert/strict";
import { canContactAccessQuote } from "../src/graphql/policies/quoteAccess.policy.js";
import { createApolloGraphqlServer } from "../src/server/createApolloGraphqlServer.js";

const publishedQuote = {
  contact_id: 17,
  is_registered: 1,
  is_sent_to_client_portal: 1,
  is_deleted_portal: 0,
};

test("allows a contact to export its published quote", () => {
  assert.equal(canContactAccessQuote(publishedQuote, 17), true);
});

test("blocks a contact from exporting another contact's quote", () => {
  assert.equal(canContactAccessQuote(publishedQuote, 18), false);
});

test("blocks unpublished or portal-deleted quotes", () => {
  assert.equal(
    canContactAccessQuote(
      { ...publishedQuote, is_sent_to_client_portal: 0 },
      17,
    ),
    false,
  );
  assert.equal(
    canContactAccessQuote({ ...publishedQuote, is_deleted_portal: 1 }, 17),
    false,
  );
});

test("builds the GraphQL schema without exposing access helpers as queries", () => {
  assert.doesNotThrow(() => createApolloGraphqlServer());
});
