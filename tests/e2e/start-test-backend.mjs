import { readFileSync, existsSync } from "node:fs";

function loadBackendEnv() {
  const envPath = "backend/.env";
  if (!existsSync(envPath)) return {};
  const loaded = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
    loaded[key] = process.env[key];
  }
  return loaded;
}

loadBackendEnv();
const databaseName = process.env.MYSQL_TEST_DATABASE || process.env.E2E_MYSQL_DATABASE || "business_control_test";

process.env.NODE_ENV = "test";
process.env.RUN_INTEGRATION_TESTS = "true";
process.env.RUN_MIGRATIONS = "false";
process.env.MYSQL_DATABASE = databaseName;
process.env.JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret";
process.env.PORT = process.env.PORT || "4000";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://127.0.0.1:5173";

const { ensureTestDatabase, prepareIsolatedTestDatabase } = await import("../../backend/tests/helpers/testDatabase.js");

await ensureTestDatabase(databaseName);
await prepareIsolatedTestDatabase();
process.chdir("backend");
await import("../../backend/src/index.js");
