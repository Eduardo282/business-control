ALTER TABLE quotes
ADD COLUMN notification_dismissed TINYINT(1) NOT NULL DEFAULT 0 AFTER notification_read;
