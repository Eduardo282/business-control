-- Migration 024: Add client_name and contact_name snapshot columns to quotes and sales
-- Preserves the business name and contact name on quotes/sales even when
-- the client or contact is physically deleted from MySQL.

ALTER TABLE quotes ADD COLUMN client_name VARCHAR(180) NULL;
ALTER TABLE quotes ADD COLUMN contact_name VARCHAR(120) NULL;

ALTER TABLE sales ADD COLUMN client_name VARCHAR(180) NULL;
ALTER TABLE sales ADD COLUMN contact_name VARCHAR(120) NULL;

-- Backfill existing quotes
UPDATE quotes q
JOIN clients c ON q.client_id = c.id
SET q.client_name = c.business_name
WHERE q.client_name IS NULL;

UPDATE quotes q
JOIN client_contacts cc ON q.contact_id = cc.id
SET q.contact_name = cc.full_name
WHERE q.contact_name IS NULL;

-- Backfill existing sales
UPDATE sales s
JOIN clients c ON s.client_id = c.id
SET s.client_name = c.business_name
WHERE s.client_name IS NULL;

UPDATE sales s
JOIN client_contacts cc ON s.contact_id = cc.id
SET s.contact_name = cc.full_name
WHERE s.contact_name IS NULL;
