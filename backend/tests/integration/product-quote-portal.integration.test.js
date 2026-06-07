import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";

import { pool } from "../../src/config/db.js";
import { createApolloGraphqlServer } from "../../src/server/createApolloGraphqlServer.js";
import { createLoaders } from "../../src/graphql/dataloaders/createLoaders.js";
import { prepareIsolatedTestDatabase } from "../helpers/testDatabase.js";

let server;
let actors;

const adminContext = () => ({
  user: { userId: actors.adminUserId, id: actors.adminUserId, role: "ADMIN" },
  loaders: createLoaders(),
});

const portalContext = () => ({
  user: { contactId: actors.contactId, clientId: actors.clientId, role: "CONTACT_PORTAL" },
  loaders: createLoaders(),
});

async function executeGraphql({ query, variables, contextValue }) {
  const response = await server.executeOperation(
    { query, variables },
    { contextValue },
  );

  assert.equal(response.body.kind, "single");
  if (response.body.singleResult.errors?.length) {
    const messages = response.body.singleResult.errors.map((error) => error.message).join("; ");
    throw new Error(messages);
  }

  return response.body.singleResult.data;
}

before(async () => {
  if (process.env.RUN_INTEGRATION_TESTS !== "true") {
    return;
  }

  actors = await prepareIsolatedTestDatabase();
  server = createApolloGraphqlServer();
  await server.start();
});

after(async () => {
  if (server) await server.stop();
  await pool.end();
});

describe("product → quote → contact portal integration", () => {
  test("registered quote uses its own folio and is published to the contact portal", { skip: process.env.RUN_INTEGRATION_TESTS !== "true" }, async () => {
    const suffix = Date.now();
    const productName = `Integration Service ${suffix}`;

    const createdProductData = await executeGraphql({
      contextValue: adminContext(),
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            folio
            name
            category
            product_type
            current_price
            users_count
            update_version
          }
        }
      `,
      variables: {
        input: {
          name: productName,
          category: "Integration Services",
          price: 1250.5,
          users_count: 20,
          description: "Created by isolated integration test",
          product_type: "SERVICE",
        },
      },
    });

    const product = createdProductData.createProduct;
    assert.match(product.folio, /^SRV-\d{6}$/);
    assert.equal(product.product_type, "SERVICE");
    assert.equal(product.users_count, 1);
    assert.equal(product.update_version, 1);

    const createdQuoteData = await executeGraphql({
      contextValue: adminContext(),
      query: `
        mutation CreateQuote($input: CreateQuoteInput!) {
          createQuote(input: $input) {
            id
            folio
            total
            status
            is_registered
            registered_at
            is_sent_to_client_portal
            items {
              quantity
              base_unit_price
              unit_price
              discount
              total
              product {
                id
                folio
                name
              }
            }
          }
        }
      `,
      variables: {
        input: {
          client_id: actors.clientId,
          contact_id: actors.contactId,
          notes: "Integration quote should be hidden until registered",
          items: [{ product_id: product.id, quantity: 2, discount: 10 }],
        },
      },
    });

    const draftQuote = createdQuoteData.createQuote;
    assert.match(draftQuote.folio, /^[A-Z]{4}\d{3}$/);
    assert.notEqual(draftQuote.folio, product.folio);
    assert.equal(draftQuote.is_registered, false);
    assert.equal(draftQuote.registered_at, null);
    assert.equal(draftQuote.is_sent_to_client_portal, null);
    assert.equal(draftQuote.items[0].product.folio, product.folio);
    assert.equal(Number(draftQuote.items[0].base_unit_price), 1250.5);
    assert.equal(Number(draftQuote.items[0].discount), 10);

    const hiddenPortalData = await executeGraphql({
      contextValue: portalContext(),
      query: `
        query PortalQuotesBeforeRegistration {
          quotes {
            id
            folio
          }
        }
      `,
    });

    assert.deepEqual(hiddenPortalData.quotes, []);

    const registeredQuoteData = await executeGraphql({
      contextValue: adminContext(),
      query: `
        mutation RegisterQuote($id: ID!) {
          registerQuote(id: $id) {
            id
            folio
            is_registered
            registered_at
            is_sent_to_client_portal
          }
        }
      `,
      variables: { id: draftQuote.id },
    });

    const registeredQuote = registeredQuoteData.registerQuote;
    assert.equal(registeredQuote.folio, draftQuote.folio);
    assert.equal(registeredQuote.is_registered, true);
    assert.ok(registeredQuote.registered_at);
    assert.equal(registeredQuote.is_sent_to_client_portal, true);

    const visiblePortalData = await executeGraphql({
      contextValue: portalContext(),
      query: `
        query PortalQuotesAfterRegistration {
          quotes {
            id
            folio
            total
            is_registered
            is_sent_to_client_portal
            items {
              product {
                folio
                name
              }
              quantity
              total
            }
          }
        }
      `,
    });

    assert.equal(visiblePortalData.quotes.length, 1);
    const portalQuote = visiblePortalData.quotes[0];
    assert.equal(portalQuote.id, draftQuote.id);
    assert.equal(portalQuote.folio, draftQuote.folio);
    assert.notEqual(portalQuote.folio, product.folio);
    assert.equal(portalQuote.items[0].product.folio, product.folio);
    assert.equal(portalQuote.items[0].product.name, productName);
  });
});
