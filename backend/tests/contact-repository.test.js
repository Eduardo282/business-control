import test from "node:test";
import assert from "node:assert/strict";
import { deleteQuote } from "../src/repositories/quote.repository.js";
import { softDeleteContact } from "../src/repositories/contact.repository.js";

test("softDeleteContact disables the contact without deleting it", async () => {
  const queries = [];
  const queryRunner = {
    async query(sql, params) {
      queries.push({ sql, params });
      return [{ affectedRows: 1 }];
    },
  };

  const result = await softDeleteContact(42, queryRunner);

  assert.equal(result, true);
  assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /^UPDATE client_contacts SET is_active = 0/);
  assert.doesNotMatch(queries[0].sql, /DELETE FROM client_contacts/i);
  assert.deepEqual(queries[0].params, [42]);
});

test("deleteQuote physically removes quote items and the quote", async () => {
  const queries = [];
  const queryRunner = {
    async query(sql, params) {
      queries.push({ sql, params });
      if (sql.startsWith("SELECT id FROM sales")) return [[], []];
      return [{ affectedRows: 1 }, []];
    },
  };

  const result = await deleteQuote({ quoteId: 42, queryRunner });

  assert.equal(result, 1);
  assert.equal(queries.length, 3);
  assert.match(queries[1].sql, /DELETE FROM quote_items/);
  assert.match(queries[2].sql, /DELETE FROM quotes/);
  assert.deepEqual(queries[1].params, [42]);
  assert.deepEqual(queries[2].params, [42]);
});

test("deleteQuote refuses to remove a quote linked to a sale", async () => {
  const queryRunner = {
    async query(sql) {
      if (sql.startsWith("SELECT id FROM sales")) return [[{ id: 9 }], []];
      throw new Error("The quote should not be deleted");
    },
  };

  await assert.rejects(
    deleteQuote({ quoteId: 42, queryRunner }),
    /venta asociada/,
  );
});
