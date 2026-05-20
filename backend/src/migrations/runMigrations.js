import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const MIGRATIONS_TABLE = "schema_migrations";

function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*--.*$/gm, "");
}

function splitSqlStatements(sql) {
  const statements = [];
  const cleaned = stripComments(sql);
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let escaped = false;

  for (const char of cleaned) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (char === "'" && !inDouble && !inBacktick) {
      inSingle = !inSingle;
      current += char;
      continue;
    }

    if (char === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble;
      current += char;
      continue;
    }

    if (char === "`" && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }

    if (char === ";" && !inSingle && !inDouble && !inBacktick) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function isIgnorableError(error) {
  const code = error?.code;
  if (code === "ER_DUP_FIELDNAME") return true;
  if (code === "ER_DUP_KEYNAME") return true;
  if (code === "ER_TABLE_EXISTS_ERROR") return true;
  if (code === "ER_DUP_ENTRY") return true;

  const message = String(error?.message || "");
  return (
    /Duplicate column name/i.test(message) ||
    /already exists/i.test(message)
  );
}

async function ensureMigrationsTable(connection) {
  await connection.query(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

export async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    await ensureMigrationsTable(connection);

    const [rows] = await connection.query(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name ASC`,
    );
    const applied = new Set(rows.map((row) => row.name));

    const migrationsDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "sql",
      "migrations",
    );

    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const appliedNow = [];

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await fs.readFile(join(migrationsDir, file), "utf8");
      const statements = splitSqlStatements(sql);

      logger.info(`Applying migration ${file}`);

      await connection.beginTransaction();
      try {
        for (const statement of statements) {
          try {
            await connection.query(statement);
          } catch (error) {
            if (isIgnorableError(error)) {
              logger.warn(`Skipped statement in ${file} (already applied)`);
              continue;
            }
            throw error;
          }
        }

        await connection.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
          [file],
        );
        await connection.commit();
        appliedNow.push(file);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    return appliedNow;
  } finally {
    connection.release();
  }
}
