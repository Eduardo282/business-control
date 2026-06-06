ALTER TABLE quotes
  ADD COLUMN registered_at DATETIME NULL AFTER is_registered;

UPDATE quotes
SET registered_at = COALESCE(created_at, NOW())
WHERE is_registered = 1
  AND registered_at IS NULL;
