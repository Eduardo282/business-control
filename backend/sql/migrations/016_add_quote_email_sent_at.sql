ALTER TABLE quotes
ADD COLUMN email_sent_at DATETIME NULL AFTER registered_at;

UPDATE quotes
SET email_sent_at = COALESCE(registered_at, created_at)
WHERE status = 'ENVIADA'
  AND email_sent_at IS NULL;
