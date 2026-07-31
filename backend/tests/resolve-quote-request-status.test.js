import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  acceptResolvedQuoteRequest,
  createQuote,
  findContactRequestedQuoteForUpdate,
  registerQuote,
  resolveQuoteRequest,
} from "../src/repositories/quote.repository.js";
import {
  assertGenericQuoteStatusUpdateAllowed,
  VALID_ADMIN_QUOTE_STATUSES,
} from "../src/modules/quotes/quoteActions.js";

test("migration backfills only the historical portal request signature", () => {
  const migration = readFileSync(
    new URL("../sql/migrations/020_add_quote_contact_request_origin.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /status = 'SOLICITADA'/);
  assert.match(migration, /user_id IS NULL/);
  assert.match(migration, /contact_id IS NOT NULL/);
  assert.match(migration, /is_registered = 1/);
  assert.match(migration, /is_sent_to_client_portal = 1/);
  assert.match(
    migration,
    /notes = 'Solicitud de cotización desde Portal de Contacto'/,
  );
});

test("createQuote persists contact origin and defaults admin quotes to false", async () => {
  const calls = [];
  const queryRunner = {
    async query(sql, params) {
      calls.push({ sql, params });
      return [{ insertId: calls.length }];
    },
  };

  await createQuote(
    {
      folio: "REQ0001",
      client_id: 1,
      contact_id: 2,
      total: 100,
      status: "SOLICITADA",
      is_contact_requested: true,
    },
    queryRunner,
  );
  await createQuote(
    {
      folio: "ADM0001",
      client_id: 1,
      contact_id: 2,
      user_id: 3,
      total: 100,
      status: "PENDIENTE",
    },
    queryRunner,
  );

  assert.match(calls[0].sql, /is_contact_requested/);
  assert.equal(calls[0].params[7], 1);
  assert.equal(calls[1].params[7], 0);
});

test("findContactRequestedQuoteForUpdate locks only genuine portal requests", async () => {
  const calls = [];
  const queryRunner = {
    async query(sql, params) {
      calls.push({ sql, params });
      return [[{ id: 30, status: "SOLICITADA", is_contact_requested: 1 }]];
    },
  };

  const quote = await findContactRequestedQuoteForUpdate(30, queryRunner);

  assert.equal(quote.id, 30);
  assert.deepEqual(calls[0].params, [30]);
  assert.match(calls[0].sql, /status = 'SOLICITADA'/);
  assert.match(calls[0].sql, /is_contact_requested = 1/);
  assert.match(calls[0].sql, /FOR UPDATE/);
});

test("resolveQuoteRequest guards the state transition by status and durable origin", async () => {
  const calls = [];
  const queryRunner = {
    async query(sql, params) {
      calls.push({ sql, params });
      return [{ affectedRows: 1 }];
    },
  };

  const affected = await resolveQuoteRequest({
    quoteId: 30,
    folio: "REQ0001",
    client_id: 1,
    contact_id: 2,
    user_id: 3,
    total: 100,
    notes: null,
    queryRunner,
  });

  assert.equal(affected, 1);
  assert.equal(calls[0].params.at(-1), 30);
  assert.match(calls[0].sql, /status = 'SOLICITADA'/);
  assert.match(calls[0].sql, /is_contact_requested = 1/);
});

test("acceptResolvedQuoteRequest only accepts a registered quote published to the portal", async () => {
  const calls = [];
  const queryRunner = {
    async query(sql, params) {
      calls.push({ sql, params });
      return [{ affectedRows: 1 }];
    },
  };

  const affected = await acceptResolvedQuoteRequest(30, queryRunner);

  assert.equal(affected, 1);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, [30]);
  assert.match(calls[0].sql, /SET status = 'ACEPTADA'/);
  assert.match(calls[0].sql, /status = 'ENVIADA'/);
  assert.match(calls[0].sql, /is_contact_requested = 1/);
  assert.match(calls[0].sql, /is_registered = 1/);
  assert.match(calls[0].sql, /is_sent_to_client_portal = 1/);
});

test("registerQuote keeps normal admin-created portal quotes as sent", async () => {
  const calls = [];
  const queryRunner = {
    async query(sql, params) {
      calls.push({ sql, params });
      return [{ affectedRows: 1 }];
    },
  };

  const affected = await registerQuote(31, queryRunner);

  assert.equal(affected, 1);
  assert.deepEqual(calls[0].params, [31]);
  assert.match(
    calls[0].sql,
    /WHEN contact_id IS NOT NULL THEN 'ENVIADA'/,
  );
  assert.doesNotMatch(calls[0].sql, /THEN 'ACEPTADA'/);
});

test("generic admin status updates cannot forge contact requests", () => {
  assert.equal(VALID_ADMIN_QUOTE_STATUSES.has("SOLICITADA"), false);
  assert.equal(VALID_ADMIN_QUOTE_STATUSES.has("ENVIADA"), true);
});

test("generic admin status updates reject immutable contact-request quotes", () => {
  assert.throws(
    () => assertGenericQuoteStatusUpdateAllowed(null),
    /Cotización no encontrada/,
  );
  assert.throws(
    () =>
      assertGenericQuoteStatusUpdateAllowed({
        id: 30,
        is_contact_requested: 1,
      }),
    /solicitadas por el contacto no pueden cambiarse/,
  );
  assert.doesNotThrow(() =>
    assertGenericQuoteStatusUpdateAllowed({
      id: 31,
      is_contact_requested: 0,
    }),
  );
});
