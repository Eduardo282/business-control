ALTER TABLE quotes
ADD COLUMN is_contact_requested TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

UPDATE quotes
SET is_contact_requested = 1
WHERE status = 'SOLICITADA'
  AND user_id IS NULL
  AND contact_id IS NOT NULL
  AND is_registered = 1
  AND is_sent_to_client_portal = 1
  AND notes = 'Solicitud de cotización desde Portal de Contacto';
