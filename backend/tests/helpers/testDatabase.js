import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../../src/config/db.js";

export const TEST_DATABASE_NAME = process.env.MYSQL_TEST_DATABASE || "business_control_test";
export const TEST_ADMIN_EMAIL = "admin@businesscontrol.test";
export const TEST_ADMIN_PASSWORD = "Admin123*";
export const TEST_PORTAL_EMAIL = "portal-contact@businesscontrol.test";
export const TEST_PORTAL_PASSWORD = "Password123*";

const ADMIN_PASSWORD_HASH = "$2a$10$/2bZf8v74shgLeu4bShB5.5R5JJdkIRtCGhJSDFbnZr6RaXqxaLQu";
const PORTAL_PASSWORD_HASH = "$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu";

export function assertSafeTestDatabaseName(databaseName = process.env.MYSQL_DATABASE) {
  const normalized = String(databaseName || "").trim();
  if (!normalized) throw new Error("MYSQL_DATABASE is required for database integration tests.");
  if (process.env.ALLOW_NON_TEST_DATABASE === "true") return normalized;
  if (!/(^test_|_test$)/i.test(normalized)) {
    throw new Error(
      `Refusing to reset non-test database "${normalized}". Use a database ending in _test or set ALLOW_NON_TEST_DATABASE=true intentionally.`,
    );
  }
  return normalized;
}

export async function ensureTestDatabase(databaseName = TEST_DATABASE_NAME) {
  const safeDatabase = assertSafeTestDatabaseName(databaseName);
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: false,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${safeDatabase.replace(/`/g, "``")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }

  return safeDatabase;
}

export async function resetTestDatabase(queryRunner = pool) {
  assertSafeTestDatabaseName(process.env.MYSQL_DATABASE);

  // 1. Dynamic Drop Tables
  const [tablesResult] = await queryRunner.query("SHOW TABLES");
  const dbNameRow = await queryRunner.query("SELECT DATABASE() as db");
  const dbName = dbNameRow[0][0].db;
  const key = `Tables_in_${dbName}`;

  await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const row of tablesResult) {
    if (row[key]) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`${row[key]}\``);
    }
  }
  await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1");

  // Helper to parse and execute SQL statements
  const runSqlScript = async (filePath) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const statements = content
        .split("\\n")
        .filter(line => !line.trim().startsWith("--")) // Strip comments
        .join("\\n")
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const stmt of statements) {
        await queryRunner.query(stmt);
      }
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlBaseDir = path.join(__dirname, "../../sql");

  // 2. Run Baseline Schema
  await runSqlScript(path.join(sqlBaseDir, "baseline.sql"));

  // 3. Run Migrations sequentially
  const migrationsDir = path.join(sqlBaseDir, "migrations");
  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith(".sql")).sort();
    for (const file of sqlFiles) {
      await runSqlScript(path.join(migrationsDir, file));
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

export async function seedTestActors(queryRunner = pool) {
  await queryRunner.query("INSERT INTO roles (name) VALUES ('ADMIN'), ('VENTAS'), ('SOPORTE'), ('CONTACTO')");

  const [adminRoleRows] = await queryRunner.query("SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1");
  const adminRoleId = adminRoleRows[0].id;

  const [adminResult] = await queryRunner.query(
    `INSERT INTO users (role_id, full_name, email, telefono, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [adminRoleId, "Integration Admin", TEST_ADMIN_EMAIL, "555-0000", ADMIN_PASSWORD_HASH],
  );

  const adminUserId = adminResult.insertId;

  const [clientResult] = await queryRunner.query(
    `INSERT INTO clients (created_by_user_id, business_name, rfc, email1, celular, telefono, codigo_postal, ciudad)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      adminUserId,
      "Integration Client S.A.",
      "XAXX010101000",
      "client@businesscontrol.test",
      "555-1111",
      "555-2222",
      "44100",
      "Guadalajara",
    ],
  );

  const clientId = clientResult.insertId;

  const [contactResult] = await queryRunner.query(
    `INSERT INTO client_contacts (client_id, full_name, email, phone, position_title, has_portal_access, portal_password_hash)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [clientId, "Integration Portal Contact", TEST_PORTAL_EMAIL, "555-3333", "QA Contact", PORTAL_PASSWORD_HASH],
  );

  return {
    adminUserId,
    adminEmail: TEST_ADMIN_EMAIL,
    adminPassword: TEST_ADMIN_PASSWORD,
    clientId,
    contactId: contactResult.insertId,
    portalEmail: TEST_PORTAL_EMAIL,
    portalPassword: TEST_PORTAL_PASSWORD,
  };
}

export async function prepareIsolatedTestDatabase() {
  await resetTestDatabase();
  return seedTestActors();
}
