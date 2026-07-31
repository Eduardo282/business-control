import test from "node:test";
import assert from "node:assert/strict";

import { addClientColumnsForImport } from "../src/services/clientsDynamic.service.js";

test("adds imported client columns without passing metadata as query runner", async () => {
  const clauses = ["ADD COLUMN `sector` TEXT NULL"];
  let receivedArguments = null;

  const addColumns = async (...args) => {
    receivedArguments = args;
  };

  await addClientColumnsForImport(clauses, addColumns);

  assert.deepEqual(receivedArguments, [clauses]);
});
