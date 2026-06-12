CREATE TABLE IF NOT EXISTS form_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  form_key VARCHAR(100) NOT NULL,
  scope_key VARCHAR(255) NOT NULL DEFAULT 'global',
  data_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_form_drafts_user_form_scope (user_id, form_key, scope_key),
  INDEX idx_form_drafts_user_updated_at (user_id, updated_at),
  CONSTRAINT fk_form_drafts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
