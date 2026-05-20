import { test, after } from "node:test";
import assert from "node:assert/strict";

import { pool } from "../src/config/db.js";
import { createQuoteFromDraft } from "../src/graphql/actions/quote_actions/createQuote.action.js";
import { createQuoteActor, createQuoteDraft } from "../src/services/quoteDraft.service.js";

after(async () => {
  await pool.end();
});

const canRun = process.env.RUN_INTEGRATION_TESTS === "true";

test("createQuoteFromDraft stores discount columns", { skip: !canRun }, async () => {
  const suffix = Date.now();
  let userId;
  let clientId;
  let productId;
  let quoteId;

  try {
    const [roleRows] = await pool.query(
      "SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1",
    );
    if (!roleRows.length) {
      throw new Error("ADMIN role missing for integration test");
    }

    const [userRes] = await pool.query(
      `INSERT INTO users (role_id, full_name, email, telefono, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [
        roleRows[0].id,
        `Integration User ${suffix}`,
        `integration-${suffix}@example.com`,
        "555-0101",
        "$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu",
      ],
    );
    userId = userRes.insertId;

    const [clientRes] = await pool.query(
      `INSERT INTO clients (created_by_user_id, business_name, rfc)
       VALUES (?, ?, ?)`,
      [userId, `Integration Client ${suffix}`, "XAXX010101000"],
    );
    clientId = clientRes.insertId;

    const [productRes] = await pool.query(
      `INSERT INTO products (name, category, product_type, current_price, client_id)
       VALUES (?, ?, ?, ?, ?)`,
      [`Integration Product ${suffix}`, "Servicios", "PRODUCT", 100, null],
    );
    productId = productRes.insertId;

    const quoteDraft = createQuoteDraft({
      client_id: clientId,
      contact_id: null,
      items: [{ product_id: productId, quantity: 2, discount: 10 }],
      notes: "integration test",
    });
    const actor = createQuoteActor({ id: userId });

    const result = await createQuoteFromDraft({ quoteDraft, actor });
    quoteId = result.id;

    const [items] = await pool.query(
      "SELECT base_unit_price, discount FROM quote_items WHERE quote_id = ?",
      [quoteId],
    );

    assert.ok(items.length > 0);
    assert.ok(Number(items[0].base_unit_price) > 0);
    assert.equal(Number(items[0].discount), 10);
  } finally {
    if (quoteId) {
      await pool.query("DELETE FROM quote_items WHERE quote_id = ?", [quoteId]);
      await pool.query("DELETE FROM quotes WHERE id = ?", [quoteId]);
    }
    if (productId) {
      await pool.query("DELETE FROM products WHERE id = ?", [productId]);
    }
    if (clientId) {
      await pool.query("DELETE FROM clients WHERE id = ?", [clientId]);
    }
    if (userId) {
      await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    }
  }
});
