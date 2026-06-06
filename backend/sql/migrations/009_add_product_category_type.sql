CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  product_type VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE product_categories
  ADD COLUMN product_type VARCHAR(20) NULL AFTER name;

UPDATE products
SET product_type = 'POLICY'
WHERE UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT'
  AND (
    UPPER(COALESCE(name, '')) LIKE '%POLIZA%'
    OR UPPER(COALESCE(category, '')) LIKE '%POLIZA%'
  );

UPDATE products
SET product_type = 'SERVICE'
WHERE UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT'
  AND (
    UPPER(COALESCE(name, '')) LIKE '%SERVICIO%'
    OR UPPER(COALESCE(category, '')) LIKE '%SERVICIO%'
  );

UPDATE products
SET product_type = 'CONTPAQI'
WHERE UPPER(COALESCE(name, '')) LIKE '%CONTPAQI%'
  AND UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT';

INSERT INTO product_categories (name, product_type)
SELECT
  category AS name,
  CASE
    WHEN SUM(UPPER(COALESCE(product_type, 'PRODUCT')) = 'SERVICE') > 0 THEN 'SERVICE'
    WHEN SUM(UPPER(COALESCE(product_type, 'PRODUCT')) = 'POLICY') > 0 THEN 'POLICY'
    WHEN SUM(
      UPPER(COALESCE(product_type, 'PRODUCT')) = 'CONTPAQI'
      OR UPPER(COALESCE(name, '')) LIKE '%CONTPAQI%'
    ) > 0 THEN 'CONTPAQI'
    ELSE 'PRODUCT'
  END AS product_type
FROM products
WHERE category IS NOT NULL AND TRIM(category) <> ''
GROUP BY category
ON DUPLICATE KEY UPDATE
  product_type = COALESCE(product_categories.product_type, VALUES(product_type));
