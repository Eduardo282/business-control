-- Add soft-delete flag to quotes.
ALTER TABLE quotes
  ADD COLUMN is_deleted_admin TINYINT DEFAULT 0 AFTER notification_read;

UPDATE quotes
SET is_deleted_admin = 0
WHERE is_deleted_admin IS NULL;
