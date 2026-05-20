-- Add discount columns to quote_items.
ALTER TABLE quote_items
  ADD COLUMN base_unit_price DECIMAL(10,2) NULL AFTER quantity;

ALTER TABLE quote_items
  ADD COLUMN discount DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER unit_price;

UPDATE quote_items
SET base_unit_price = unit_price
WHERE base_unit_price IS NULL;

UPDATE quote_items
SET discount = 0
WHERE discount IS NULL;
