-- Create fulfillment tables for service and policy tracking.
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
