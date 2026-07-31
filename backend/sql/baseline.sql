-- Baseline schema definition (reusable for dev and tests)

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
  status ENUM('PENDIENTE', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'SOLICITADA') DEFAULT 'PENDIENTE',
  is_contact_requested TINYINT(1) NOT NULL DEFAULT 0,
  is_registered TINYINT NOT NULL DEFAULT 1,
  registered_at DATETIME NULL,
  email_sent_at DATETIME NULL,
  notes TEXT NULL,
  is_sent_to_client_portal TINYINT DEFAULT 0,
  portal_responded_at DATETIME NULL,
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

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folio VARCHAR(30) NULL,
  quote_id INT NOT NULL,
  client_id INT NOT NULL,
  contact_id INT NULL,
  user_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  status ENUM('GENERADA', 'ENVIADA') DEFAULT 'GENERADA',
  email_sent_at DATETIME NULL,
  is_sent_to_client_portal TINYINT DEFAULT 0,
  portal_sent_at DATETIME NULL,
  is_deleted_admin TINYINT DEFAULT 0,
  is_deleted_portal TINYINT DEFAULT 0,
  INDEX idx_sales_quote_id (quote_id),
  INDEX idx_sales_client_id (client_id),
  INDEX idx_sales_contact_id (contact_id),
  INDEX idx_sales_user_id (user_id),
  UNIQUE KEY uq_sales_folio (folio),
  CONSTRAINT fk_sales_quotes FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_sales_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  quote_item_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  base_unit_price DECIMAL(10,2) NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  INDEX idx_sale_items_sale_id (sale_id),
  INDEX idx_sale_items_quote_item_id (quote_item_id),
  INDEX idx_sale_items_product_id (product_id),
  UNIQUE KEY uq_sale_items_quote_item_id (quote_item_id),
  CONSTRAINT fk_sale_items_sales FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_quote_items FOREIGN KEY (quote_item_id) REFERENCES quote_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
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
    REFERENCES support_conversations(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  product_type VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

