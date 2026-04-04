-- Tablas dedicadas para servicios y polizas.
-- Mantienen relacion 1:1 con contact_products para no romper la interfaz actual.

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
  CONSTRAINT fk_services_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_services_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_services_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_services_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_services_client_contact (client_id, contact_id),
  INDEX idx_services_product (product_id)
);

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
  CONSTRAINT fk_policies_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_policies_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_policies_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_policies_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_policies_client_contact (client_id, contact_id),
  INDEX idx_policies_product (product_id)
);

-- Backfill inicial para historico existente.
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
