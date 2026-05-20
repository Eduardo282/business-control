-- Create metadata table for dynamic client columns.
CREATE TABLE IF NOT EXISTS clients_column_meta (
  column_name VARCHAR(128) NOT NULL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  display_order INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
