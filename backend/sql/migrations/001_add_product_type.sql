-- Add product_type column to products.
ALTER TABLE products
  ADD COLUMN product_type VARCHAR(20) NULL DEFAULT 'PRODUCT' AFTER category;

UPDATE products
SET product_type = 'PRODUCT'
WHERE product_type IS NULL;
