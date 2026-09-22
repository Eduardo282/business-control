-- Retire business policies while preserving services and commercial documents.
-- Back up the database before applying. DDL commits implicitly in MySQL.
-- Temporary IDs also let a retry complete safely if the final DROP fails.
CREATE TEMPORARY TABLE IF NOT EXISTS removed_policy_products (id INT PRIMARY KEY);
DELETE FROM removed_policy_products;
INSERT INTO removed_policy_products (id)
SELECT id FROM products
WHERE UPPER(TRIM(COALESCE(product_type, ''))) = 'POLICY'
   OR (
     UPPER(TRIM(COALESCE(product_type, 'PRODUCT'))) IN ('', 'PRODUCT')
     AND (
       LOWER(name) COLLATE utf8mb4_unicode_ci REGEXP '^p[oó]lizas?([[:space:]]|$)'
       OR LOWER(category) COLLATE utf8mb4_unicode_ci REGEXP '^p[oó]lizas?([[:space:]]|$)'
     )
   );

CREATE TEMPORARY TABLE IF NOT EXISTS affected_policy_quotes (id INT PRIMARY KEY);
DELETE FROM affected_policy_quotes;
INSERT INTO affected_policy_quotes (id)
SELECT DISTINCT qi.quote_id FROM quote_items qi
JOIN removed_policy_products p ON p.id = qi.product_id;

CREATE TEMPORARY TABLE IF NOT EXISTS affected_policy_sales (id INT PRIMARY KEY);
DELETE FROM affected_policy_sales;
INSERT INTO affected_policy_sales (id)
SELECT DISTINCT si.sale_id FROM sale_items si
JOIN removed_policy_products p ON p.id = si.product_id;
INSERT IGNORE INTO affected_policy_sales (id)
SELECT DISTINCT si.sale_id FROM sale_items si
JOIN quote_items qi ON qi.id = si.quote_item_id
JOIN removed_policy_products p ON p.id = qi.product_id;

-- Cascades remove only the retired products' assignments, histories and lines.
DELETE p FROM products p JOIN removed_policy_products r ON r.id = p.id;

-- Match shared/quotePricingRules.js: discounted subtotal plus rounded 16% IVA.
UPDATE quotes q JOIN affected_policy_quotes a ON a.id = q.id
LEFT JOIN (SELECT quote_id, SUM(total) subtotal FROM quote_items GROUP BY quote_id) i
  ON i.quote_id = q.id
SET q.total = COALESCE(i.subtotal, 0) + ROUND(COALESCE(i.subtotal, 0) * 0.16, 2);

UPDATE sales s JOIN affected_policy_sales a ON a.id = s.id
LEFT JOIN (SELECT sale_id, SUM(total) subtotal FROM sale_items GROUP BY sale_id) i
  ON i.sale_id = s.id
SET s.total = COALESCE(i.subtotal, 0) + ROUND(COALESCE(i.subtotal, 0) * 0.16, 2);

DELETE c FROM product_categories c
LEFT JOIN products p ON p.category = c.name
WHERE p.id IS NULL AND (
  UPPER(TRIM(COALESCE(c.product_type, ''))) = 'POLICY'
  OR LOWER(c.name) COLLATE utf8mb4_unicode_ci REGEXP '^p[oó]lizas?([[:space:]]|$)'
);

-- A shared category may still belong to a surviving service or product.
UPDATE product_categories c
JOIN (
  SELECT category,
    CASE WHEN SUM(product_type = 'SERVICE') > 0 THEN 'SERVICE'
         WHEN SUM(product_type = 'CONTPAQI') > 0 THEN 'CONTPAQI'
         ELSE 'PRODUCT' END AS product_type
  FROM products GROUP BY category
) p ON p.category = c.name
SET c.product_type = p.product_type
WHERE UPPER(TRIM(COALESCE(c.product_type, ''))) = 'POLICY';

DROP TABLE IF EXISTS policies;
DROP TEMPORARY TABLE affected_policy_sales;
DROP TEMPORARY TABLE affected_policy_quotes;
DROP TEMPORARY TABLE removed_policy_products;
