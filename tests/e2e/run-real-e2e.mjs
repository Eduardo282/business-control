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
import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const command = isWindows ? "pnpm.cmd" : "pnpm";
const args = ["exec", "playwright", "test", "tests/e2e/quote-to-portal.spec.js", "--project=chromium", "--trace", "on"];

const env = {
  ...process.env,
  NODE_ENV: "test",
  PLAYWRIGHT_START_SERVERS: "true",
  E2E_REAL_FLOW: "true",
  E2E_USE_TEST_DATABASE: "true",
  E2E_BACKEND_PORT: process.env.E2E_BACKEND_PORT || "4100",
  E2E_FRONTEND_PORT: process.env.E2E_FRONTEND_PORT || "5174",
  E2E_BASE_URL: process.env.E2E_BASE_URL || "http://127.0.0.1:5174",
  E2E_API_URL: process.env.E2E_API_URL || "http://127.0.0.1:4100/graphql",
  E2E_ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL || "admin@businesscontrol.test",
  E2E_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD || "Admin123*",
  E2E_PORTAL_EMAIL: process.env.E2E_PORTAL_EMAIL || "portal-contact@businesscontrol.test",
  E2E_PORTAL_PASSWORD: process.env.E2E_PORTAL_PASSWORD || "Password123*",
  MYSQL_TEST_DATABASE: process.env.MYSQL_TEST_DATABASE || "business_control_test",
  JWT_SECRET: process.env.JWT_SECRET || "e2e-test-secret",
};

const child = spawn(command, args, {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: isWindows,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
