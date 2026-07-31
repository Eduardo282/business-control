SET @support_messages_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'support_messages'
);

SET @support_conversations_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'support_conversations'
);

SET @support_messages_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_support_messages_conversation'
    AND TABLE_NAME = 'support_messages'
);

SET @drop_support_messages_fk_sql := IF(
  @support_messages_fk_exists > 0,
  'ALTER TABLE support_messages DROP FOREIGN KEY fk_support_messages_conversation',
  'SELECT 1'
);

PREPARE drop_support_messages_fk_stmt FROM @drop_support_messages_fk_sql;
EXECUTE drop_support_messages_fk_stmt;
DEALLOCATE PREPARE drop_support_messages_fk_stmt;

SET @add_support_messages_fk_sql := IF(
  @support_messages_exists > 0 AND @support_conversations_exists > 0,
  'ALTER TABLE support_messages ADD CONSTRAINT fk_support_messages_conversation FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE RESTRICT',
  'SELECT 1'
);

PREPARE add_support_messages_fk_stmt FROM @add_support_messages_fk_sql;
EXECUTE add_support_messages_fk_stmt;
DEALLOCATE PREPARE add_support_messages_fk_stmt;
