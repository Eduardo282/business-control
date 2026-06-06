-- Track catalog product update revisions and timestamped update history.
ALTER TABLE products
  ADD COLUMN update_version INT NOT NULL DEFAULT 1 AFTER description;

ALTER TABLE products
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER update_version;

ALTER TABLE products
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

UPDATE products
SET update_version = 1
WHERE update_version IS NULL OR update_version < 1;

CREATE TABLE IF NOT EXISTS product_update_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  update_version INT NOT NULL DEFAULT 1,
  change_type VARCHAR(40) NOT NULL DEFAULT 'DETAILS',
  summary VARCHAR(255) NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_update_history_product_id (product_id),
  CONSTRAINT fk_product_update_history_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO product_update_history (product_id, update_version, change_type, summary, changed_at)
SELECT
  p.id,
  GREATEST(COALESCE(p.update_version, 1), 1),
  'CREATED',
  'Registro inicial del producto',
  COALESCE(p.created_at, CURRENT_TIMESTAMP)
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM product_update_history puh
  WHERE puh.product_id = p.id
);
