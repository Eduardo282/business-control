ALTER TABLE quotes
ADD COLUMN portal_responded_at DATETIME NULL AFTER is_sent_to_client_portal;
