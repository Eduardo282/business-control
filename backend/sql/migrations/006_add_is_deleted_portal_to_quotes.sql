-- Add portal-only soft-delete flag to quotes.
ALTER TABLE quotes
  ADD COLUMN is_deleted_portal TINYINT DEFAULT 0 AFTER is_deleted_admin;

UPDATE quotes
SET is_deleted_portal = 0
WHERE is_deleted_portal IS NULL;
