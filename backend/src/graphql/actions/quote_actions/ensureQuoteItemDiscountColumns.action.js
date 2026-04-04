import { pool } from "../../../config/db.js";

let columnsReady = false;
let columnsReadyPromise = null;

function isDuplicateColumnError(error) {
  return (
    error?.code === "ER_DUP_FIELDNAME" ||
    /Duplicate column name/i.test(error?.message || "")
  );
}

async function getQuoteItemsColumns() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'quote_items'`,
  );

  return new Set(rows.map((row) => row.COLUMN_NAME));
}

export async function ensureQuoteItemDiscountColumnsAction() {
  if (columnsReady) return true;
  if (columnsReadyPromise) return columnsReadyPromise;

  columnsReadyPromise = (async () => {
    let columns = await getQuoteItemsColumns();

    if (!columns.has("base_unit_price")) {
      try {
        await pool.query(
          "ALTER TABLE quote_items ADD COLUMN base_unit_price DECIMAL(10,2) NULL AFTER quantity",
        );
      } catch (error) {
        if (!isDuplicateColumnError(error)) throw error;
      }
    }

    if (!columns.has("discount")) {
      try {
        await pool.query(
          "ALTER TABLE quote_items ADD COLUMN discount DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER unit_price",
        );
      } catch (error) {
        if (!isDuplicateColumnError(error)) throw error;
      }
    }

    try {
      await pool.query(
        "UPDATE quote_items SET base_unit_price = unit_price WHERE base_unit_price IS NULL",
      );
    } catch (error) {
      if (error?.code !== "ER_BAD_FIELD_ERROR") throw error;
    }

    try {
      await pool.query(
        "UPDATE quote_items SET discount = 0 WHERE discount IS NULL",
      );
    } catch (error) {
      if (error?.code !== "ER_BAD_FIELD_ERROR") throw error;
    }

    columns = await getQuoteItemsColumns();
    columnsReady = columns.has("base_unit_price") && columns.has("discount");

    return columnsReady;
  })();

  try {
    return await columnsReadyPromise;
  } finally {
    columnsReadyPromise = null;
  }
}
