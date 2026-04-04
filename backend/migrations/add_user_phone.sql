SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'telefono'
);

SET @alter_sql = IF(
  @column_exists = 0,
  'ALTER TABLE users ADD COLUMN telefono VARCHAR(40) NULL AFTER email',
  'SELECT 1'
);

PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
