-- Business Control - MySQL Workbench full setup
-- Ejecuta este archivo completo en MySQL Workbench.
-- Base usada por backend/src/config/env.js: MYSQL_DATABASE=business_control

CREATE DATABASE IF NOT EXISTS business_control
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE business_control;

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(40) NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  form_key VARCHAR(100) NOT NULL,
  scope_key VARCHAR(255) NOT NULL DEFAULT 'global',
  data_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_form_drafts_user_form_scope (user_id, form_key, scope_key),
  INDEX idx_form_drafts_user_updated_at (user_id, updated_at),
  CONSTRAINT fk_form_drafts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by_user_id INT NOT NULL,
  business_name VARCHAR(180) NOT NULL,
  rfc VARCHAR(20) NULL,
  email1 VARCHAR(120) NULL,
  email2 VARCHAR(120) NULL,
  celular VARCHAR(40) NULL,
  telefono VARCHAR(40) NULL,
  codigo_postal VARCHAR(20) NULL,
  ciudad VARCHAR(120) NULL,
  address TEXT NULL,
  has_client_portal_access TINYINT DEFAULT 0,
  portal_password_hash VARCHAR(255) NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clients_business_name (business_name),
  CONSTRAINT fk_clients_users FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients_column_meta (
  column_name VARCHAR(128) NOT NULL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  display_order INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS client_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NULL,
  phone VARCHAR(40) NULL,
  position_title VARCHAR(80) NULL,
  has_portal_access TINYINT DEFAULT 0,
  portal_password_hash VARCHAR(255) NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contacts_client_id (client_id),
  INDEX idx_contacts_email (email),
  CONSTRAINT fk_contacts_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folio VARCHAR(30) NULL UNIQUE,
  client_id INT NULL,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  product_type VARCHAR(20) NULL DEFAULT 'PRODUCT',
  current_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  users_count INT DEFAULT 0,
  description TEXT NULL,
  expires_at DATETIME NULL,
  is_active TINYINT DEFAULT 1,
  update_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_client_id (client_id),
  INDEX idx_products_name (name),
  CONSTRAINT fk_products_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history_product_id (product_id),
  CONSTRAINT fk_history_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS client_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  product_id INT NOT NULL,
  license_key VARCHAR(100) NULL,
  start_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_client_products_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_client_products_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  contact_id INT NOT NULL,
  product_id INT NOT NULL,
  license_key VARCHAR(100) NULL,
  start_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_products_client_contact (client_id, contact_id),
  INDEX idx_contact_products_product (product_id),
  CONSTRAINT fk_cp_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_product_id INT NOT NULL UNIQUE,
  client_id INT NOT NULL,
  contact_id INT NOT NULL,
  product_id INT NOT NULL,
  folio VARCHAR(100) NULL,
  start_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_services_client_contact (client_id, contact_id),
  INDEX idx_services_product (product_id),
  CONSTRAINT fk_services_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_services_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_services_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_services_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_product_id INT NOT NULL UNIQUE,
  client_id INT NOT NULL,
  contact_id INT NOT NULL,
  product_id INT NOT NULL,
  folio VARCHAR(100) NULL,
  start_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_policies_client_contact (client_id, contact_id),
  INDEX idx_policies_product (product_id),
  CONSTRAINT fk_policies_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_policies_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_policies_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_policies_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folio VARCHAR(30) NULL,
  client_id INT NOT NULL,
  contact_id INT NULL,
  user_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'REQUESTED') DEFAULT 'PENDING',
  is_registered TINYINT NOT NULL DEFAULT 1,
  registered_at DATETIME NULL,
  notes TEXT NULL,
  is_sent_to_client_portal TINYINT DEFAULT 0,
  notification_read TINYINT DEFAULT 0,
  is_deleted_admin TINYINT DEFAULT 0,
  is_deleted_portal TINYINT DEFAULT 0,
  INDEX idx_quotes_client_id (client_id),
  INDEX idx_quotes_user_id (user_id),
  INDEX idx_quotes_contact_id (contact_id),
  INDEX idx_quotes_status (status),
  UNIQUE KEY uq_quotes_folio (folio),
  CONSTRAINT fk_quotes_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_quotes_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_quotes_contact FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  base_unit_price DECIMAL(10,2) NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  INDEX idx_quote_items_quote_id (quote_id),
  INDEX idx_quote_items_product_id (product_id),
  CONSTRAINT fk_quote_items_quotes FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_items_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  agent_user_id INT DEFAULT NULL,
  subject VARCHAR(255) DEFAULT 'Soporte General',
  status ENUM('WAITING','ACTIVE','CLOSED') NOT NULL DEFAULT 'WAITING',
  rating TINYINT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at DATETIME DEFAULT NULL,
  INDEX idx_status (status),
  INDEX idx_contact (contact_id),
  INDEX idx_agent (agent_user_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_type ENUM('CLIENT','AGENT','SYSTEM') NOT NULL,
  sender_id INT DEFAULT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conv (conversation_id, created_at),
  CONSTRAINT fk_support_messages_conversation FOREIGN KEY (conversation_id)
    REFERENCES support_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  product_type VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- Compatibilidad si ya tenias una BD creada con un init.sql anterior.
DELIMITER $$
DROP PROCEDURE IF EXISTS bc_add_column_if_missing $$
CREATE PROCEDURE bc_add_column_if_missing(
  IN p_table VARCHAR(128),
  IN p_column VARCHAR(128),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
  ) THEN
    SET @bc_sql = CONCAT('ALTER TABLE `', REPLACE(p_table, '`', '``'), '` ADD COLUMN ', p_definition);
    PREPARE bc_stmt FROM @bc_sql;
    EXECUTE bc_stmt;
    DEALLOCATE PREPARE bc_stmt;
  END IF;
END $$
DELIMITER ;

CALL bc_add_column_if_missing('users', 'telefono', '`telefono` VARCHAR(40) NULL AFTER `email`');
CALL bc_add_column_if_missing('clients', 'email1', '`email1` VARCHAR(120) NULL AFTER `rfc`');
CALL bc_add_column_if_missing('clients', 'email2', '`email2` VARCHAR(120) NULL AFTER `email1`');
CALL bc_add_column_if_missing('clients', 'celular', '`celular` VARCHAR(40) NULL AFTER `email2`');
CALL bc_add_column_if_missing('clients', 'telefono', '`telefono` VARCHAR(40) NULL AFTER `celular`');
CALL bc_add_column_if_missing('clients', 'codigo_postal', '`codigo_postal` VARCHAR(20) NULL AFTER `telefono`');
CALL bc_add_column_if_missing('clients', 'ciudad', '`ciudad` VARCHAR(120) NULL AFTER `codigo_postal`');
CALL bc_add_column_if_missing('clients', 'address', '`address` TEXT NULL AFTER `ciudad`');
CALL bc_add_column_if_missing('clients', 'has_client_portal_access', '`has_client_portal_access` TINYINT DEFAULT 0 AFTER `address`');
CALL bc_add_column_if_missing('clients', 'portal_password_hash', '`portal_password_hash` VARCHAR(255) NULL AFTER `has_client_portal_access`');
CALL bc_add_column_if_missing('client_contacts', 'has_portal_access', '`has_portal_access` TINYINT DEFAULT 0 AFTER `position_title`');
CALL bc_add_column_if_missing('client_contacts', 'portal_password_hash', '`portal_password_hash` VARCHAR(255) NULL AFTER `has_portal_access`');
CALL bc_add_column_if_missing('products', 'folio', '`folio` VARCHAR(30) NULL AFTER `id`');
CALL bc_add_column_if_missing('products', 'client_id', '`client_id` INT NULL AFTER `id`');
CALL bc_add_column_if_missing('products', 'product_type', '`product_type` VARCHAR(20) NULL DEFAULT \'PRODUCT\' AFTER `category`');
CALL bc_add_column_if_missing('products', 'users_count', '`users_count` INT DEFAULT 0 AFTER `current_price`');
CALL bc_add_column_if_missing('products', 'expires_at', '`expires_at` DATETIME NULL AFTER `description`');
CALL bc_add_column_if_missing('products', 'update_version', '`update_version` INT NOT NULL DEFAULT 1 AFTER `description`');
CALL bc_add_column_if_missing('products', 'created_at', '`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `update_version`');
CALL bc_add_column_if_missing('products', 'updated_at', '`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');
CALL bc_add_column_if_missing('product_categories', 'product_type', '`product_type` VARCHAR(20) NULL AFTER `name`');
CALL bc_add_column_if_missing('contact_products', 'client_id', '`client_id` INT NULL AFTER `id`');
CALL bc_add_column_if_missing('quotes', 'folio', '`folio` VARCHAR(30) NULL AFTER `id`');
CALL bc_add_column_if_missing('quotes', 'contact_id', '`contact_id` INT NULL AFTER `client_id`');
CALL bc_add_column_if_missing('quotes', 'is_registered', '`is_registered` TINYINT NOT NULL DEFAULT 1 AFTER `status`');
CALL bc_add_column_if_missing('quotes', 'registered_at', '`registered_at` DATETIME NULL AFTER `is_registered`');
CALL bc_add_column_if_missing('quotes', 'is_sent_to_client_portal', '`is_sent_to_client_portal` TINYINT DEFAULT 0 AFTER `notes`');
CALL bc_add_column_if_missing('quotes', 'notification_read', '`notification_read` TINYINT DEFAULT 0 AFTER `is_sent_to_client_portal`');
CALL bc_add_column_if_missing('quotes', 'is_deleted_admin', '`is_deleted_admin` TINYINT DEFAULT 0 AFTER `notification_read`');
CALL bc_add_column_if_missing('quotes', 'is_deleted_portal', '`is_deleted_portal` TINYINT DEFAULT 0 AFTER `is_deleted_admin`');
CALL bc_add_column_if_missing('quote_items', 'base_unit_price', '`base_unit_price` DECIMAL(10,2) NULL AFTER `quantity`');
CALL bc_add_column_if_missing('quote_items', 'discount', '`discount` DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER `unit_price`');

ALTER TABLE quotes MODIFY COLUMN user_id INT NULL;
ALTER TABLE quotes MODIFY COLUMN status ENUM('PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'REQUESTED') DEFAULT 'PENDING';

UPDATE contact_products cp
JOIN client_contacts cc ON cc.id = cp.contact_id
SET cp.client_id = cc.client_id
WHERE cp.client_id IS NULL;

UPDATE quote_items
SET base_unit_price = unit_price
WHERE base_unit_price IS NULL;

UPDATE quote_items
SET discount = 0
WHERE discount IS NULL;

UPDATE quotes
SET registered_at = COALESCE(created_at, NOW())
WHERE is_registered = 1
  AND registered_at IS NULL;

UPDATE products
SET update_version = 1
WHERE update_version IS NULL OR update_version < 1;

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
WHERE UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT'
  AND UPPER(COALESCE(name, '')) LIKE '%CONTPAQI%';

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

SET @bc_products_folio_unique_index := (
  SELECT INDEX_NAME
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'folio'
    AND NON_UNIQUE = 0
  LIMIT 1
);
SET @bc_products_folio_unique_sql := IF(
  @bc_products_folio_unique_index IS NULL,
  'ALTER TABLE products ADD UNIQUE INDEX uq_products_folio (folio)',
  'SELECT 1'
);
PREPARE bc_products_folio_unique_stmt FROM @bc_products_folio_unique_sql;
EXECUTE bc_products_folio_unique_stmt;
DEALLOCATE PREPARE bc_products_folio_unique_stmt;

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

UPDATE quotes
SET folio = CONCAT(
  CHAR(65 + MOD(FLOOR((id - 1) / 17576000), 26)),
  CHAR(65 + MOD(FLOOR((id - 1) / 676000), 26)),
  CHAR(65 + MOD(FLOOR((id - 1) / 26000), 26)),
  CHAR(65 + MOD(FLOOR((id - 1) / 1000), 26)),
  LPAD(MOD(id, 1000), 3, '0')
)
WHERE id IS NOT NULL
  AND (
    folio IS NULL
    OR TRIM(folio) = ''
    OR folio NOT REGEXP '^[A-Z]{4}[0-9]{3}$'
  );

ALTER TABLE quotes ADD UNIQUE INDEX uq_quotes_folio (folio);

DROP PROCEDURE IF EXISTS bc_add_column_if_missing;

-- Roles base.
INSERT IGNORE INTO roles (name)
VALUES ('ADMIN'), ('VENTAS'), ('SOPORTE'), ('CONTACTO');

-- Usuarios demo.
-- admin@businesscontrol.com / Admin123*
-- ventas@businesscontrol.com / Password123*
-- soporte@businesscontrol.com / Password123*
INSERT INTO users (role_id, full_name, email, telefono, password_hash)
SELECT r.id, 'Administrador', 'admin@businesscontrol.com', '555-000-0000',
       '$2a$10$/2bZf8v74shgLeu4bShB5.5R5JJdkIRtCGhJSDFbnZr6RaXqxaLQu'
FROM roles r
WHERE r.name = 'ADMIN'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  full_name = VALUES(full_name),
  telefono = VALUES(telefono);

INSERT INTO users (role_id, full_name, email, telefono, password_hash)
SELECT r.id, 'Vendedor Demo', 'ventas@businesscontrol.com', '555-111-0000',
       '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
FROM roles r
WHERE r.name = 'VENTAS'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  full_name = VALUES(full_name),
  telefono = VALUES(telefono);

INSERT INTO users (role_id, full_name, email, telefono, password_hash)
SELECT r.id, 'Soporte Tecnico', 'soporte@businesscontrol.com', '555-222-0000',
       '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
FROM roles r
WHERE r.name = 'SOPORTE'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  full_name = VALUES(full_name),
  telefono = VALUES(telefono);

SET @admin_id := (SELECT id FROM users WHERE email = 'admin@businesscontrol.com' LIMIT 1);

INSERT INTO clients (
  created_by_user_id,
  business_name,
  rfc,
  email1,
  email2,
  celular,
  telefono,
  codigo_postal,
  ciudad,
  address
)
SELECT
  @admin_id,
  'Empresa Cliente Demo',
  'XAXX010101000',
  'contacto@cliente.com',
  'compras@cliente.com',
  '555-333-4444',
  '555-333-0000',
  '64000',
  'Monterrey',
  'Av. Demo 123'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE business_name = 'Empresa Cliente Demo'
);

SET @client_id := (SELECT id FROM clients WHERE business_name = 'Empresa Cliente Demo' LIMIT 1);

INSERT INTO client_contacts (
  client_id,
  full_name,
  email,
  phone,
  position_title,
  has_portal_access,
  portal_password_hash
)
SELECT
  @client_id,
  'Contacto Demo Portal',
  'contacto@cliente.com',
  '555-111-2222',
  'Compras',
  1,
  '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
WHERE NOT EXISTS (
  SELECT 1 FROM client_contacts WHERE email = 'contacto@cliente.com'
);

UPDATE client_contacts
SET
  client_id = @client_id,
  full_name = 'Contacto Demo Portal',
  phone = '555-111-2222',
  position_title = 'Compras',
  has_portal_access = 1,
  portal_password_hash = '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
WHERE email = 'contacto@cliente.com';

-- Catalogo de productos base.
INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Licencia Anual ERP', 'Licencias', 12000.00, 'Acceso completo al sistema ERP por 1 anio. Incluye soporte estandar.', 5, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Licencia Anual ERP');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Poliza de Soporte Premium', 'Servicios', 5000.00, 'Soporte 24/7 y tiempo de respuesta menor a 2 horas.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Poliza de Soporte Premium');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Modulo de Facturacion', 'Add-ons', 3500.00, 'Timbrado ilimitado.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Modulo de Facturacion');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Instalacion en Sitio', 'Servicios', 2500.00, 'Visita tecnica para configuracion de servidores.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Instalacion en Sitio');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Servicio Personalizado Demo', 'Servicio Personalizado', 1800.00, 'Servicio asignable a contacto para pruebas.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Servicio Personalizado Demo');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Poliza Personalizada Demo', 'Poliza Personalizada', 4200.00, 'Poliza asignable a contacto para pruebas.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Poliza Personalizada Demo');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Contabilidad (Desktop)', 'Contabilidad y Finanzas', 4590.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Contabilidad (Desktop)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Contabiliza (Nube)', 'Contabilidad y Finanzas', 3890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Contabiliza (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Bancos (Desktop)', 'Contabilidad y Finanzas', 3590.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Bancos (Desktop)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Analiza (Nube)', 'Contabilidad y Finanzas', 2990.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Analiza (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Nominas (Desktop)', 'Nominas y Recursos Humanos', 4890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Nominas (Desktop)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Personia (Nube)', 'Nominas y Recursos Humanos', 3290.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Personia (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Evalua 035', 'Nominas y Recursos Humanos', 2500.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Evalua 035');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Colabora', 'Nominas y Recursos Humanos', 1500.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Colabora');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Comercial (Start, Pro y Premium)', 'Comercial y Ventas', 5290.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Comercial (Start, Pro y Premium)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Factura Electronica', 'Comercial y Ventas', 2890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Factura Electronica');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Vende (Nube)', 'Comercial y Ventas', 2190.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Vende (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Cobra', 'Comercial y Ventas', 1890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Cobra');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi XML en Linea+', 'Herramientas de Productividad y Nube', 1990.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi XML en Linea+');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Escritorio Virtual', 'Herramientas de Productividad y Nube', 890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Escritorio Virtual');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Respaldos', 'Herramientas de Productividad y Nube', 1290.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Respaldos');

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
WHERE UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT'
  AND UPPER(COALESCE(name, '')) LIKE '%CONTPAQI%';

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

INSERT INTO product_price_history (product_id, price)
SELECT p.id, p.current_price
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM product_price_history h
  WHERE h.product_id = p.id
);

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

SET @contact_id := (SELECT id FROM client_contacts WHERE email = 'contacto@cliente.com' LIMIT 1);
SET @service_product_id := (SELECT id FROM products WHERE name = 'Servicio Personalizado Demo' LIMIT 1);
SET @policy_product_id := (SELECT id FROM products WHERE name = 'Poliza Personalizada Demo' LIMIT 1);
SET @license_product_id := (SELECT id FROM products WHERE name = 'CONTPAQi Contabilidad (Desktop)' LIMIT 1);

INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
SELECT @client_id, @contact_id, @license_product_id, 'LIC-DEMO-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ACTIVE'
WHERE @contact_id IS NOT NULL
  AND @license_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_products
    WHERE contact_id = @contact_id
      AND product_id = @license_product_id
      AND license_key = 'LIC-DEMO-001'
  );

INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
SELECT @client_id, @contact_id, @service_product_id, 'SRV-DEMO-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'ACTIVE'
WHERE @contact_id IS NOT NULL
  AND @service_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_products
    WHERE contact_id = @contact_id
      AND product_id = @service_product_id
      AND license_key = 'SRV-DEMO-001'
  );

INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
SELECT @client_id, @contact_id, @policy_product_id, 'POL-DEMO-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ACTIVE'
WHERE @contact_id IS NOT NULL
  AND @policy_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_products
    WHERE contact_id = @contact_id
      AND product_id = @policy_product_id
      AND license_key = 'POL-DEMO-001'
  );

INSERT INTO services (
  contact_product_id,
  client_id,
  contact_id,
  product_id,
  folio,
  start_date,
  expiration_date,
  status
)
SELECT
  cp.id,
  cp.client_id,
  cp.contact_id,
  cp.product_id,
  cp.license_key,
  cp.start_date,
  cp.expiration_date,
  cp.status
FROM contact_products cp
JOIN products p ON p.id = cp.product_id
LEFT JOIN services s ON s.contact_product_id = cp.id
WHERE s.id IS NULL
  AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) = 'servicio personalizado';

INSERT INTO policies (
  contact_product_id,
  client_id,
  contact_id,
  product_id,
  folio,
  start_date,
  expiration_date,
  status
)
SELECT
  cp.id,
  cp.client_id,
  cp.contact_id,
  cp.product_id,
  cp.license_key,
  cp.start_date,
  cp.expiration_date,
  cp.status
FROM contact_products cp
JOIN products p ON p.id = cp.product_id
LEFT JOIN policies pol ON pol.contact_product_id = cp.id
WHERE pol.id IS NULL
  AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) = 'poliza personalizada';

SET @quote_product_id := (SELECT id FROM products WHERE name = 'Licencia Anual ERP' LIMIT 1);
SET @quote_demo_folio := 'DEMO001';

INSERT INTO quotes (
  folio,
  client_id,
  contact_id,
  user_id,
  total,
  notes,
  status,
  is_sent_to_client_portal,
  notification_read
)
SELECT
  @quote_demo_folio,
  @client_id,
  @contact_id,
  @admin_id,
  12000.00,
  'Cotizacion demo generada desde el setup SQL.',
  'PENDING',
  1,
  0
WHERE @client_id IS NOT NULL
  AND @admin_id IS NOT NULL
  AND @quote_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM quotes WHERE notes = 'Cotizacion demo generada desde el setup SQL.');

SET @quote_id := (SELECT id FROM quotes WHERE notes = 'Cotizacion demo generada desde el setup SQL.' LIMIT 1);

INSERT INTO quote_items (
  quote_id,
  product_id,
  quantity,
  base_unit_price,
  unit_price,
  discount,
  total
)
SELECT
  @quote_id,
  @quote_product_id,
  1,
  12000.00,
  12000.00,
  0.00,
  12000.00
WHERE @quote_id IS NOT NULL
  AND @quote_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM quote_items
    WHERE quote_id = @quote_id
      AND product_id = @quote_product_id
  );

-- Login resumen:
-- Admin interno: admin@businesscontrol.com / Admin123*
-- Ventas: ventas@businesscontrol.com / Password123*
-- Soporte: soporte@businesscontrol.com / Password123*
-- Portal cliente: contacto@cliente.com / Password123*

SET SQL_SAFE_UPDATES = 1;
