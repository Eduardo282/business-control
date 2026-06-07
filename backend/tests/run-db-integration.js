import { spawn } from "node:child_process";
import { ensureTestDatabase, TEST_DATABASE_NAME } from "./helpers/testDatabase.js";

const databaseName = process.env.MYSQL_TEST_DATABASE || TEST_DATABASE_NAME;
await ensureTestDatabase(databaseName);

const env = {
  ...process.env,
  NODE_ENV: "test",
  RUN_INTEGRATION_TESTS: "true",
  MYSQL_DATABASE: databaseName,
  JWT_SECRET: process.env.JWT_SECRET || "integration-test-secret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://127.0.0.1:5173",
};

const child = spawn(process.execPath, ["--test", "tests/integration/product-quote-portal.integration.test.js"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
