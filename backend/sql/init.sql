CREATE DATABASE IF NOT EXISTS business_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE business_control;

-- ROLES
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,   -- ADMIN | VENTAS | SOPORTE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO roles (name) VALUES ('ADMIN'), ('VENTAS'), ('SOPORTE');

-- USUARIOS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(40) NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by_user_id INT NOT NULL,
  business_name VARCHAR(180) NOT NULL,
  rfc VARCHAR(20) NULL,
  address TEXT NULL,
  has_client_portal_access TINYINT(1) DEFAULT 0,
  portal_password_hash VARCHAR(255) NULL, -- Agregado para el Portal de Clientes
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clients_users FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_clients_business_name ON clients (business_name);

-- CONTACTOS
CREATE TABLE IF NOT EXISTS client_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NULL,
  phone VARCHAR(40) NULL,
  position_title VARCHAR(80) NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contacts_clients FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX idx_contacts_client_id ON client_contacts (client_id);

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL, -- Licencias, Pólizas, Hardware, etc.
  current_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_products FOREIGN KEY (product_id) REFERENCES products(id)
);

-- POLIZAS
CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('PENDING', 'SENT', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  base_unit_price DECIMAL(10, 2) NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- PRODUCTOS POR CLIENTE (SERVICIOS / LICENCIAS)
-- Registra lo que el cliente "posee" y su expiración.
CREATE TABLE IF NOT EXISTS client_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  product_id INT NOT NULL,
  license_key VARCHAR(100) NULL,
  start_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ADMIN DEFAULT (password: Admin123*)
-- hash bcryptjs (10 rounds) precomputado:
-- $2a$10$S6S8otH8w8k2d8o0pGvLqO4Xh1z6y7SxR3CkN/9Bv1FZ2xQb3v2X2
-- Nota: este hash es estático solo para bootstrap local.

INSERT IGNORE INTO users (role_id, full_name, email, password_hash)
SELECT r.id, 'Administrador', 'admin@businesscontrol.com',
'$2a$10$/2bZf8v74shgLeu4bShB5.5R5JJdkIRtCGhJSDFbnZr6RaXqxaLQu'
FROM roles r
WHERE r.name = 'ADMIN';
