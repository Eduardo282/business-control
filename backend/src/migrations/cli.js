import { runMigrations } from "./runMigrations.js";
import { logger } from "../utils/logger.js";

try {
  const applied = await runMigrations();
  if (applied.length) {
    logger.info(`Applied migrations: ${applied.join(", ")}`);
  } else {
    logger.info("No pending migrations.");
  }
  process.exit(0);
} catch (error) {
  logger.error("Migration failed", { error: error?.message || error });
  process.exit(1);
}
