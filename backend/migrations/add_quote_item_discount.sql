SET @db_name := DATABASE();

SET @has_base_unit_price := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'quote_items'
    AND COLUMN_NAME = 'base_unit_price'
);

SET @sql_base_unit_price := IF(
  @has_base_unit_price = 0,
  'ALTER TABLE quote_items ADD COLUMN base_unit_price DECIMAL(10,2) NULL AFTER quantity',
  'SELECT 1'
);

PREPARE stmt_base_unit_price FROM @sql_base_unit_price;
EXECUTE stmt_base_unit_price;
DEALLOCATE PREPARE stmt_base_unit_price;

SET @has_discount := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'quote_items'
    AND COLUMN_NAME = 'discount'
);

SET @sql_discount := IF(
  @has_discount = 0,
  'ALTER TABLE quote_items ADD COLUMN discount DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER unit_price',
  'SELECT 1'
);

PREPARE stmt_discount FROM @sql_discount;
EXECUTE stmt_discount;
DEALLOCATE PREPARE stmt_discount;

UPDATE quote_items
SET base_unit_price = unit_price
WHERE base_unit_price IS NULL;

UPDATE quote_items
SET discount = 0
WHERE discount IS NULL;
