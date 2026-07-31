import test from "node:test";
import assert from "node:assert/strict";

import { createAuthMiddleware } from "../src/middlewares/auth.middleware.js";

async function runMiddleware({ decodedUser, contact }) {
  const middleware = createAuthMiddleware({
    verifyTokenFn: () => decodedUser,
    findContactByIdFn: async () => contact,
  });
  const req = {
    headers: {
      authorization: "Bearer valid-token",
    },
  };
  let nextCalled = false;

  await middleware(req, {}, () => {
    nextCalled = true;
  });

  return { req, nextCalled };
}

test("keeps an active portal contact authenticated", async () => {
  const user = { role: "CONTACT_PORTAL", contactId: 7, clientId: 3 };
  const { req, nextCalled } = await runMiddleware({
    decodedUser: user,
    contact: {
      id: 7,
      has_portal_access: 1,
      is_active: 1,
    },
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, user);
});

test("invalidates a portal session after access is revoked", async () => {
  const { req, nextCalled } = await runMiddleware({
    decodedUser: { role: "CONTACT_PORTAL", contactId: 7, clientId: 3 },
    contact: {
      id: 7,
      has_portal_access: 0,
      is_active: 1,
    },
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user, null);
});

test("invalidates a portal session when the contact is inactive", async () => {
  const { req } = await runMiddleware({
    decodedUser: { role: "CONTACT_PORTAL", contactId: 7, clientId: 3 },
    contact: {
      id: 7,
      has_portal_access: 1,
      is_active: 0,
    },
  });

  assert.equal(req.user, null);
});

test("does not query contacts for backoffice sessions", async () => {
  let contactLookupCalled = false;
  const middleware = createAuthMiddleware({
    verifyTokenFn: () => ({ role: "ADMIN", userId: 1 }),
    findContactByIdFn: async () => {
      contactLookupCalled = true;
      return null;
    },
  });
  const req = {
    headers: {
      authorization: "Bearer valid-token",
    },
  };

  await middleware(req, {}, () => {});

  assert.equal(contactLookupCalled, false);
  assert.deepEqual(req.user, { role: "ADMIN", userId: 1 });
});
