import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, beforeEach, test } from "node:test";
import { buildSchema } from "graphql";
import { pool } from "../src/config/db.js";
import queries from "../src/graphql/resolvers/query/index.js";
import { determineStatus, isService, normalizeProductType } from "../src/utils/serviceStatus.js";
import { normalizeCatalogProductType } from "../src/repositories/product.repository.js";
import { assignCategoryTypeAction, createProductAction } from "../src/modules/products/productActions.js";
import { listAllServicesAction, updateContactProductDatesAction } from "../src/modules/services/serviceActions.js";
import { createContactProductAction, listContactProductsAction } from "../src/modules/contacts/contactActions.js";
import { registerQuoteAction } from "../src/modules/quotes/quoteActions.js";
import { getAssignedServices, getStandaloneServices, getLegacyAssignedServices } from "../src/repositories/service.repository.js";
import { insertProductFulfillmentRecord, resolveProductFulfillmentTarget } from "../src/services/productFulfillmentRegistry.service.js";

beforeEach((t) => {
  t.mock.method(pool, "query", async () => { throw new Error("Unexpected database query"); });
  t.mock.method(pool, "getConnection", async () => { throw new Error("Unexpected database connection"); });
});
after(() => pool.end());

function mockConnection(t, query) {
  const connection = {
    query: t.mock.fn(query),
    beginTransaction: t.mock.fn(async () => {}),
    commit: t.mock.fn(async () => {}),
    rollback: t.mock.fn(async () => {}),
    release: t.mock.fn(() => {}),
  };
  t.mock.method(pool, "getConnection", async () => connection);
  return connection;
}

test("GraphQL exposes services and preserves assignment and sales contracts", async () => {
  const schema = buildSchema(readFileSync(new URL("../src/graphql/schema.graphql", import.meta.url), "utf8"));
  assert.equal(String(schema.getQueryType().getFields().services.type), "[ContactProduct!]!");
  assert.equal(schema.getQueryType().getFields().policies, undefined);
  assert.equal(queries.policies, undefined);
  for (const name of ["updateContactProductDates", "createContactProduct", "createQuote", "createSaleFromQuote"]) {
    assert.ok(schema.getMutationType().getFields()[name]);
  }
  await assert.rejects(queries.services(null, {}, {}), { extensions: { code: "UNAUTHENTICATED" } });
  await assert.rejects(queries.services(null, {}, { user: { role: "CONTACT_PORTAL" } }), { extensions: { code: "FORBIDDEN" } });
});

test("normalization retains legacy service fallbacks without reviving removed types", () => {
  for (const row of [
    { product_type: " service " },
    { name: "Servicio mensual" },
    { product_category: "Servicios", product_type: null },
    { product_name: "Servicio anual", product_type: "PRODUCT" },
  ]) {
    assert.equal(normalizeProductType(row), "SERVICE");
    assert.equal(isService(row), true);
    assert.equal(resolveProductFulfillmentTarget(row).tableName, "services");
  }
  for (const row of [{}, { product_type: "CONTPAQI" }, { name: "Poliza anual" }, { product_type: "POLICY", category: "Servicios" }]) {
    assert.equal(isService(row), false);
    assert.equal(resolveProductFulfillmentTarget(row), null);
  }
  assert.equal(normalizeCatalogProductType("contpaqi_product"), "CONTPAQI");
  assert.equal(normalizeCatalogProductType(undefined), "PRODUCT");
});

test("legacy catalog input is rejected before connecting or writing", async () => {
  for (const type of ["POLICY", " policy "]) {
    assert.throws(() => normalizeCatalogProductType(type), { extensions: { code: "BAD_USER_INPUT" } });
    await assert.rejects(createProductAction({ name: "Legacy", category: "Legacy", price: 1, product_type: type }), { extensions: { code: "BAD_USER_INPUT" } });
    await assert.rejects(assignCategoryTypeAction("Legacy", type), { extensions: { code: "BAD_USER_INPUT" } });
  }
});

for (const type of ["SERVICE", "PRODUCT", "CONTPAQI"]) {
  test(`${type} catalog registration retains folios, user counts, and history`, async (t) => {
    const connection = mockConnection(t, async (sql) => {
      if (/SELECT .*product_type FROM product_categories/.test(sql)) return [[{ id: 1, name: "Catalog", product_type: type }]];
      if (/INSERT INTO/.test(sql)) return [{ insertId: 12 }];
      if (/UPDATE products/.test(sql)) return [{ affectedRows: 1 }];
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    const result = await createProductAction({ name: "Catalog item", category: "Catalog", price: 125, users_count: 5, product_type: type });
    assert.equal(result.folio, type === "SERVICE" ? "SRV-000012" : "PRD-000012");
    assert.equal(result.product_type, type);
    assert.equal(result.users_count, type === "SERVICE" ? 1 : 5);
    assert.equal(result.current_price, 125);
    assert.equal(result.update_history[0].change_type, "CREATED");
    assert.equal(connection.commit.mock.callCount(), 1);
  });
}

test("service status calculation preserves stored overrides and date boundaries", () => {
  const date = (days) => new Date(Date.now() + days * 86400000).toISOString();
  assert.equal(determineStatus("cancelled", date(30)), "CANCELLED");
  assert.equal(determineStatus("EXPIRED", date(30)), "EXPIRED");
  assert.equal(determineStatus("ACTIVE", date(-1)), "EXPIRED");
  assert.equal(determineStatus("ACTIVE", date(3)), "EXPIRING_SOON");
  assert.equal(determineStatus("ACTIVE", date(30)), "ACTIVE");
  assert.equal(determineStatus(null, null), "ACTIVE");
});

test("service repository queries retain legacy service discovery and do not access removed tables", async () => {
  for (const fetchRows of [getAssignedServices, getStandaloneServices, getLegacyAssignedServices]) {
    const runner = { async query(sql) {
      assert.doesNotMatch(sql, /\bpolicies\b|poliza/i);
      assert.match(sql, /<> 'POLICY'/);
      assert.match(sql, /product_type = 'SERVICE'/);
      assert.match(sql, /LIKE '%servicio%'/);
      return [[{ product_id: 7 }]];
    } };
    assert.deepEqual(await fetchRows(runner), [{ product_id: 7 }]);
  }
});

for (const legacy of [false, true]) {
  test(`service listing maps assigned and standalone rows (legacy=${legacy})`, async (t) => {
    t.mock.method(pool, "query", async (sql) => {
      if (legacy && /FROM services/.test(sql)) throw Object.assign(new Error("Missing table"), { code: "ER_NO_SUCH_TABLE" });
      if (/LEFT JOIN clients/.test(sql)) return [[{ product_id: 9, product_name: "Servicio nuevo" }]];
      return [[{ contact_product_id: 2, product_id: 7, product_name: "Servicio mensual", contact_id: 3, client_id: 4, start_date: "2026-01-01", expiration_date: "2099-01-01", status: "CANCELLED" }]];
    });
    const result = await queries.services(null, {}, { user: { role: "SOPORTE" } });
    assert.equal(result.length, 2);
    assert.equal(result[0].status, "CANCELLED");
    assert.equal(result[0].product.product_type, "SERVICE");
    assert.equal(result[0].start_date, "2026-01-01T00:00:00.000Z");
    assert.equal(result[1].id, "product-9");
    assert.equal(result[1].product.product_type, "SERVICE");
    await assert.rejects(updateContactProductDatesAction("product-9", {}), /aún no tiene asignación/);
  });
}

test("service listing does not hide database failures", async (t) => {
  t.mock.method(pool, "query", async () => { throw Object.assign(new Error("Denied"), { code: "ER_ACCESS_DENIED_ERROR" }); });
  await assert.rejects(listAllServicesAction(), /Denied/);
});

for (const failure of [null, "ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"]) {
  test(`assignment date edits sync services and handle ${failure || "success"}`, async (t) => {
    const connection = mockConnection(t, async (sql, params) => {
      assert.doesNotMatch(sql, /policies/i);
      if (/UPDATE services/.test(sql)) {
        assert.match(sql, /start_date = :start_date/);
        assert.match(sql, /expiration_date = :expiration_date/);
        assert.match(sql, /status = :status/);
        assert.doesNotMatch(sql, /license_key|folio/);
        assert.equal(params.status, "CANCELLED");
        if (failure) throw Object.assign(new Error(failure), { code: failure });
      }
      if (/SELECT cp\.\*/.test(sql)) return [[{ id: 2, product_id: 7, status: "CANCELLED", start_date: "2026-01-01", expiration_date: "2027-01-01", license_key: "ABC" }]];
      if (/SELECT id/.test(sql)) return [[{ id: 2 }]];
      return [{ affectedRows: 1 }];
    });
    const result = updateContactProductDatesAction(2, { start_date: "2026-01-01", expiration_date: "2027-01-01", status: "cancelled", license_key: " ABC " });
    if (failure === "ER_BAD_FIELD_ERROR") {
      await assert.rejects(result, /ER_BAD_FIELD_ERROR/);
      assert.equal(connection.rollback.mock.callCount(), 1);
      assert.equal(connection.commit.mock.callCount(), 0);
    } else {
      assert.equal((await result).status, "CANCELLED");
      assert.equal(connection.commit.mock.callCount(), 1);
    }
    assert.equal(connection.release.mock.callCount(), 1);
  });
}

test("fulfillment rejects stale targets and still inserts service dates", async () => {
  const calls = [];
  const connection = { async query(sql, params) { calls.push({ sql, params }); } };
  await assert.rejects(insertProductFulfillmentRecord(connection, { type: "POLICY", tableName: "policies" }, {}), /Unsupported/);
  await insertProductFulfillmentRecord(connection, null, {});
  assert.equal(calls.length, 0);
  await insertProductFulfillmentRecord(connection, resolveProductFulfillmentTarget({ product_type: "SERVICE" }), { product_id: 7, start_date: "2026-01-01", expiration_date: "2027-01-01" });
  assert.match(calls[0].sql, /INSERT INTO services/);
  assert.equal(calls[0].params.status, "ACTIVE");
  assert.equal(calls[0].params.expiration_date, "2027-01-01");
});

test("portal services exclude products and removed legacy assignments", async (t) => {
  t.mock.method(pool, "query", async () => [[
    { id: 1, product_id: 7, product_name: "Servicio", status: "ACTIVE" },
    { id: 2, product_id: 8, product_type: "PRODUCT", product_name: "Software" },
    { id: 3, product_id: 9, product_type: "POLICY", product_category: "Servicios" },
  ]]);
  const result = await listContactProductsAction(2);
  assert.deepEqual(result.map((row) => row.id), [1]);
});

for (const type of ["SERVICE", "PRODUCT", "POLICY"]) {
  test(`manual ${type} assignment preserves supported fulfillment only`, async (t) => {
    const connection = mockConnection(t, async (sql) => {
      if (/FROM client_contacts/.test(sql)) return [[{ id: 3, client_id: 4 }]];
      if (/FROM products/.test(sql)) return [[{ id: 7, name: "Assigned item", product_type: type }]];
      if (/INSERT INTO/.test(sql)) return [{ insertId: 20 }];
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    const result = createContactProductAction({ contact_id: 3, product_id: 7, start_date: "2026-01-01", expiration_date: "2027-01-01", status: "cancelled" });
    if (type === "POLICY") {
      await assert.rejects(result, { extensions: { code: "BAD_USER_INPUT" } });
      assert.equal(connection.query.mock.calls.some(({ arguments: [sql] }) => /INSERT/.test(sql)), false);
    } else {
      assert.equal((await result).status, "CANCELLED");
      const inserts = connection.query.mock.calls.filter(({ arguments: [sql] }) => /INSERT/.test(sql));
      assert.equal(inserts.length, type === "SERVICE" ? 2 : 1);
      assert.equal(connection.commit.mock.callCount(), 1);
    }
  });
}

test("quote registration creates service assignments per quantity without changing other lines", async (t) => {
  const quote = { id: 10, contact_id: 3, client_id: 4, created_at: "2026-01-01", folio: "Q10", is_registered: false };
  t.mock.method(pool, "query", async () => [[quote]]);
  const connection = mockConnection(t, async (sql) => {
    if (/UPDATE quotes/.test(sql)) return [{ affectedRows: 1 }];
    if (/FROM quote_items qi/.test(sql)) return [[
      { product_id: 7, product_type: "SERVICE", quantity: 2 },
      { product_id: 8, product_type: "PRODUCT", quantity: 3 },
      { product_id: 9, product_type: "POLICY", quantity: 4 },
      { product_id: 11, product_category: "Servicios", quantity: 1 },
    ]];
    if (/INSERT INTO (contact_products|services)/.test(sql)) return [{ insertId: 20 }];
    if (/FROM quotes/.test(sql)) return [[quote]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  await registerQuoteAction(10);
  const inserts = connection.query.mock.calls.filter(({ arguments: [sql] }) => /INSERT INTO services/.test(sql));
  assert.deepEqual(inserts.map(({ arguments: [, params] }) => params.product_id), [7, 7, 11]);
  for (const { arguments: [, params] } of inserts) {
    assert.equal(params.start_date, "2026-01-01");
    assert.equal(params.expiration_date, "2026-01-16");
    assert.equal(params.status, "ACTIVE");
  }
  assert.equal(connection.commit.mock.callCount(), 1);
  assert.equal(connection.rollback.mock.callCount(), 0);
});
