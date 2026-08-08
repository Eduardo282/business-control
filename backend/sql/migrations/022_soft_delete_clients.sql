-- Migration 022: Soft-delete for clients
-- Instead of physically deleting clients (which cascades to quotes/sales),
-- we mark them as deleted and preserve all historical data.

-- 1. Add is_deleted column to clients
ALTER TABLE clients ADD COLUMN is_deleted TINYINT NOT NULL DEFAULT 0;

-- 2. Change quotes FK from CASCADE to SET NULL so deleting a client
--    (if it ever happens physically) won't destroy quote history.
ALTER TABLE quotes DROP FOREIGN KEY fk_quotes_clients;
ALTER TABLE quotes MODIFY COLUMN client_id INT NULL;
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_clients
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 3. Change sales FK from CASCADE to SET NULL
ALTER TABLE sales DROP FOREIGN KEY fk_sales_clients;
ALTER TABLE sales MODIFY COLUMN client_id INT NULL;
ALTER TABLE sales ADD CONSTRAINT fk_sales_clients
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 4. Change services FK from CASCADE to SET NULL
ALTER TABLE services DROP FOREIGN KEY fk_services_clients;
ALTER TABLE services MODIFY COLUMN client_id INT NULL;
ALTER TABLE services ADD CONSTRAINT fk_services_clients
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 5. Change policies FK from CASCADE to SET NULL
ALTER TABLE policies DROP FOREIGN KEY fk_policies_clients;
ALTER TABLE policies MODIFY COLUMN client_id INT NULL;
ALTER TABLE policies ADD CONSTRAINT fk_policies_clients
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
