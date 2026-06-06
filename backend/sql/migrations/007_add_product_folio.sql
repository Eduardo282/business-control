-- Add immutable catalog folios to products and use them as quote folios.
ALTER TABLE products
  ADD COLUMN folio VARCHAR(30) NULL AFTER id;

UPDATE products
SET folio = CONCAT(
  CASE
    WHEN UPPER(COALESCE(product_type, 'PRODUCT')) = 'SERVICE' THEN 'SRV'
    WHEN UPPER(COALESCE(product_type, 'PRODUCT')) = 'POLICY' THEN 'POL'
    ELSE 'PRD'
  END,
  '-',
  LPAD(id, 6, '0')
)
WHERE folio IS NULL OR TRIM(folio) = '';

ALTER TABLE products
  ADD UNIQUE INDEX uq_products_folio (folio);

SET @bc_quote_folio_unique_index := (
  SELECT INDEX_NAME
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'quotes'
    AND COLUMN_NAME = 'folio'
    AND NON_UNIQUE = 0
  LIMIT 1
);

SET @bc_drop_quote_folio_unique_sql := IF(
  @bc_quote_folio_unique_index IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE quotes DROP INDEX `', REPLACE(@bc_quote_folio_unique_index, '`', '``'), '`')
);

PREPARE bc_drop_quote_folio_unique_stmt FROM @bc_drop_quote_folio_unique_sql;
EXECUTE bc_drop_quote_folio_unique_stmt;
DEALLOCATE PREPARE bc_drop_quote_folio_unique_stmt;

UPDATE quotes q
JOIN (
  SELECT qi.quote_id, p.folio
  FROM quote_items qi
  JOIN (
    SELECT quote_id, MIN(id) AS first_item_id
    FROM quote_items
    GROUP BY quote_id
  ) first_item ON first_item.first_item_id = qi.id
  JOIN products p ON p.id = qi.product_id
) primary_product ON primary_product.quote_id = q.id
SET q.folio = primary_product.folio
WHERE primary_product.folio IS NOT NULL
  AND TRIM(primary_product.folio) <> '';
