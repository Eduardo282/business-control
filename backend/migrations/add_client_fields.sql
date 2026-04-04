-- Migración para agregar nuevos campos a la tabla clients
-- Ejecutar cada línea por separado en MySQL/MariaDB

ALTER TABLE clients ADD COLUMN email1 VARCHAR(255) NULL;
ALTER TABLE clients ADD COLUMN email2 VARCHAR(255) NULL;
ALTER TABLE clients ADD COLUMN celular VARCHAR(50) NULL;
ALTER TABLE clients ADD COLUMN telefono VARCHAR(50) NULL;
ALTER TABLE clients ADD COLUMN codigo_postal VARCHAR(10) NULL;
ALTER TABLE clients ADD COLUMN ciudad VARCHAR(100) NULL;

-- Verificar que las columnas fueron agregadas correctamente
-- DESCRIBE clients;
