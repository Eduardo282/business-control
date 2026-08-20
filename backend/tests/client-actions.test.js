import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteClientAction,
  searchClientsAction,
} from "../src/modules/clients/clientActions.js";
import { listContactsByClientAction } from "../src/modules/contacts/contactActions.js";

test("deleteClientAction accepts both primitive ID and object parameter", async () => {
  const resultPrimitive = await deleteClientAction("999999");
  assert.strictEqual(typeof resultPrimitive, "boolean");

  const resultObject = await deleteClientAction({ id: "999999" });
  assert.strictEqual(typeof resultObject, "boolean");
});

test("listContactsByClientAction accepts primitive client_id", async () => {
  const contacts = await listContactsByClientAction("999999");
  assert.strictEqual(Array.isArray(contacts), true);
});

test("searchClientsAction accepts both primitive string and object parameter", async () => {
  const byString = await searchClientsAction("text");
  assert.strictEqual(Array.isArray(byString), true);

  const byObject = await searchClientsAction({ q: "text" });
  assert.strictEqual(Array.isArray(byObject), true);
});

