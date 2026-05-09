-- ============================================================
-- Chat de Soporte en Tiempo Real — Tablas MySQL
-- ============================================================

-- Conversaciones de soporte
CREATE TABLE IF NOT EXISTS support_conversations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  contact_id    INT            NOT NULL COMMENT 'ID del contacto (cliente) que inicia el chat',
  agent_user_id INT            DEFAULT NULL COMMENT 'ID del usuario (agente) asignado',
  subject       VARCHAR(255)   DEFAULT 'Soporte General',
  status        ENUM('WAITING','ACTIVE','CLOSED') NOT NULL DEFAULT 'WAITING',
  rating        TINYINT        DEFAULT NULL COMMENT 'Calificación del 1 al 5 al cerrar',
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at     DATETIME       DEFAULT NULL,

  INDEX idx_status    (status),
  INDEX idx_contact   (contact_id),
  INDEX idx_agent     (agent_user_id),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mensajes dentro de cada conversación
CREATE TABLE IF NOT EXISTS support_messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT          NOT NULL,
  sender_type     ENUM('CLIENT','AGENT','SYSTEM') NOT NULL,
  sender_id       INT          DEFAULT NULL COMMENT 'contact_id o user_id según sender_type',
  body            TEXT         NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_conv    (conversation_id, created_at),
  FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
