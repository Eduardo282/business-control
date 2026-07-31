import test from "node:test";
import assert from "node:assert/strict";

import { sendQuoteEmailAction } from "../src/graphql/actions/quote_actions/sendQuoteEmail.action.js";
import {
  findUnreadQuoteRequests,
  markQuoteEmailSent,
  registerQuote,
  updatePortalQuoteResponseStatus,
  updateQuotePortalStatus,
} from "../src/repositories/quote.repository.js";

const quote = {
  id: 42,
  folio: "ABC123",
  client: {
    business_name: "Cliente de prueba",
  },
  items: [],
};

function createDependencies(overrides = {}) {
  return {
    fetchFullQuote: async () => quote,
    renderHtmlToPdf: async () => Buffer.from("pdf"),
    buildQuotePdfHtml: () => "<html>PDF</html>",
    buildQuoteEmailHtml: () => "<html>Email</html>",
    calculateQuotePricing: () => ({
      items: [],
      grossSubtotal: 0,
      subtotal: 0,
      totalDiscount: 0,
      iva: 0,
      total: 0,
    }),
    validateEmailDeliverability: async () => ({ valid: true, reason: "OK" }),
    sendQuoteEmailMessage: async () => ({ accepted: ["contact@example.com"] }),
    markQuoteEmailSent: async () => 1,
    logger: {
      info() {},
      warn() {},
      error() {},
    },
    ...overrides,
  };
}

const input = {
  quote_id: 42,
  contact_email: "contact@example.com",
  message: "Cotización adjunta",
};

test("returns success immediately and dispatches SMTP in background", async () => {
  let smtpResolved = false;
  const dependencies = createDependencies({
    sendQuoteEmailMessage: async () => {
      // Simulate slow SMTP
      await new Promise((resolve) => setTimeout(resolve, 50));
      smtpResolved = true;
    },
  });

  const result = await sendQuoteEmailAction(input, dependencies);

  // The action returns before SMTP completes
  assert.deepEqual(result, {
    success: true,
    message: "Correo enviado correctamente.",
    email_sent_at: result.email_sent_at,
  });
  assert.ok(Number.isFinite(Date.parse(result.email_sent_at)));

  // SMTP hasn't finished yet since it runs in background
  assert.equal(smtpResolved, false, "SMTP should run in background, not blocking the response");

  // Wait for background delivery to complete
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(smtpResolved, true, "SMTP should eventually complete in background");
});

test("persists email_sent_at optimistically before SMTP delivery", async () => {
  const calls = [];
  const dependencies = createDependencies({
    sendQuoteEmailMessage: async () => {
      calls.push("smtp");
    },
    markQuoteEmailSent: async (quoteId) => {
      calls.push("persist");
      assert.equal(quoteId, 42);
      return 1;
    },
  });

  await sendQuoteEmailAction(input, dependencies);

  // Persist is called immediately (optimistic), before SMTP completes
  assert.ok(calls.includes("persist"), "Status should be persisted optimistically");
});

test("does not throw when SMTP delivery fails in background", async () => {
  const errors = [];
  const dependencies = createDependencies({
    sendQuoteEmailMessage: async () => {
      throw new Error("SMTP unavailable");
    },
    logger: {
      info() {},
      warn() {},
      error(...args) { errors.push(args); },
    },
  });

  // Should NOT reject — SMTP failure is handled in background
  const result = await sendQuoteEmailAction(input, dependencies);
  assert.equal(result.success, true);

  // Wait for background task to log the error
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.ok(
    errors.some((e) => String(e).includes("Background email delivery failed")),
    "SMTP errors should be logged but not thrown",
  );
});

test("rejects blocked email addresses without sending or changing status", async () => {
  let emailWasSent = false;
  let statusWasUpdated = false;
  const dependencies = createDependencies({
    validateEmailDeliverability: async () => ({
      valid: false,
      reason: "Dirección inválida",
    }),
    sendQuoteEmailMessage: async () => {
      emailWasSent = true;
    },
    markQuoteEmailSent: async () => {
      statusWasUpdated = true;
    },
  });

  await assert.rejects(
    sendQuoteEmailAction(input, dependencies),
    /Dirección inválida/,
  );
  assert.equal(emailWasSent, false);
  assert.equal(statusWasUpdated, false);
});

test("always generates PDF server-side (ignores pdf_base64)", async () => {
  let renderPdfCalled = false;
  const dependencies = createDependencies({
    renderHtmlToPdf: async () => {
      renderPdfCalled = true;
      return Buffer.from("server-pdf");
    },
  });

  // Even if someone passes pdf_base64, it should be ignored
  const inputWithPdf = { ...input, pdf_base64: "some-base64-data" };
  await sendQuoteEmailAction(inputWithPdf, dependencies);

  assert.equal(renderPdfCalled, true, "Server-side PDF rendering should always be called");
});

test("fetches quote and validates email concurrently", async () => {
  let releaseValidation;
  const validationPending = new Promise((resolve) => {
    releaseValidation = resolve;
  });
  let fetchStarted = false;

  const dependencies = createDependencies({
    fetchFullQuote: async () => {
      fetchStarted = true;
      return quote;
    },
    validateEmailDeliverability: async () => {
      await validationPending;
      return { valid: true, reason: "OK" };
    },
  });

  const actionPromise = sendQuoteEmailAction(input, dependencies);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(
    fetchStarted,
    true,
    "Quote fetch should start concurrently with email validation",
  );

  releaseValidation();
  await actionPromise;
});

test("persists email delivery independently from the commercial status", async () => {
  let executedSql = "";
  let executedParams = [];
  const queryRunner = {
    query: async (sql, params) => {
      executedSql = sql;
      executedParams = params;
      return [{ affectedRows: 1 }];
    },
  };

  const affectedRows = await markQuoteEmailSent(42, queryRunner);

  assert.equal(affectedRows, 1);
  assert.match(executedSql, /email_sent_at = NOW\(\)/);
  assert.match(
    executedSql,
    /WHEN status IN \('ACEPTADA', 'RECHAZADA'\) THEN status/,
  );
  assert.match(executedSql, /ELSE 'ENVIADA'/);
  assert.doesNotMatch(
    executedSql,
    /is_sent_to_client_portal = 1 THEN 'ACEPTADA'/,
  );
  assert.deepEqual(executedParams, [42]);
});

test("publishing a registered quote to the portal marks it as sent", async () => {
  let executedSql = "";
  let executedParams = [];
  const queryRunner = {
    query: async (sql, params) => {
      executedSql = sql;
      executedParams = params;
      return [{ affectedRows: 1 }];
    },
  };

  const affectedRows = await updateQuotePortalStatus(
    {
      quoteId: 42,
      isSentToClientPortal: 1,
      contactId: 17,
    },
    queryRunner,
  );

  assert.equal(affectedRows, 1);
  assert.match(
    executedSql,
    /WHEN \? = 1 AND is_registered = 1 THEN 'ENVIADA'/,
  );
  assert.doesNotMatch(executedSql, /THEN 'ACEPTADA'/);
  assert.deepEqual(executedParams, [1, 17, 1, 42]);
});

test("registering a quote with a portal contact marks it as sent", async () => {
  let executedSql = "";
  const queryRunner = {
    query: async (sql) => {
      executedSql = sql;
      return [{ affectedRows: 1 }];
    },
  };

  const affectedRows = await registerQuote(42, queryRunner);

  assert.equal(affectedRows, 1);
  assert.match(
    executedSql,
    /WHEN contact_id IS NOT NULL THEN 'ENVIADA'/,
  );
  assert.doesNotMatch(executedSql, /THEN 'ACEPTADA'/);
});

test("portal quote responses store a response timestamp and reopen admin notification", async () => {
  let executedSql = "";
  let executedParams = [];
  const queryRunner = {
    query: async (sql, params) => {
      executedSql = sql;
      executedParams = params;
      return [{ affectedRows: 1 }];
    },
  };

  const affectedRows = await updatePortalQuoteResponseStatus(
    { quoteId: 42, status: "ACEPTADA" },
    queryRunner,
  );

  assert.equal(affectedRows, 1);
  assert.match(executedSql, /portal_responded_at = NOW\(\)/);
  assert.match(executedSql, /notification_read = 0/);
  assert.match(executedSql, /status IN \(\?, \?, \?\)/);
  assert.match(executedSql, /portal_responded_at IS NULL/);
  assert.deepEqual(executedParams, [
    "ACEPTADA",
    42,
    "SOLICITADA",
    "PENDIENTE",
    "ENVIADA",
  ]);
});

test("admin quote notifications only include accepted quotes that came from portal responses", async () => {
  let executedSql = "";
  const queryRunner = {
    query: async (sql) => {
      executedSql = sql;
      return [[]];
    },
  };

  await findUnreadQuoteRequests(queryRunner);

  assert.match(executedSql, /status = 'SOLICITADA'/);
  assert.match(executedSql, /status IN \('ACEPTADA', 'RECHAZADA'\)/);
  assert.match(executedSql, /portal_responded_at IS NOT NULL/);
});
