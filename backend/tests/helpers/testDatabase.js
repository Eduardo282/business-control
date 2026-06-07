import mysql from "mysql2/promise";
import { pool } from "../../src/config/db.js";

export const TEST_DATABASE_NAME = process.env.MYSQL_TEST_DATABASE || "business_control_test";
export const TEST_ADMIN_EMAIL = "admin@businesscontrol.test";
export const TEST_ADMIN_PASSWORD = "Admin123*";
export const TEST_PORTAL_EMAIL = "portal-contact@businesscontrol.test";
export const TEST_PORTAL_PASSWORD = "Password123*";

const ADMIN_PASSWORD_HASH = "$2a$10$/2bZf8v74shgLeu4bShB5.5R5JJdkIRtCGhJSDFbnZr6RaXqxaLQu";
const PORTAL_PASSWORD_HASH = "$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu";

const DROP_TABLES = [
  "services",
  "policies",
  "contact_products",
  "client_products",
  "quote_items",
  "quotes",
  "product_update_history",
  "product_price_history",
  "product_categories",
  "products",
  "client_contacts",
  "clients_column_meta",
  "clients",
  "users",
  "roles",
  "schema_migrations",
];

const SCHEMA_STATEMENTS = [
  `CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    telefono VARCHAR(40) NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_users_roles FOREIGN KEY (role_id) REFERENCES roles(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_by_user_id INT NOT NULL,
    business_name VARCHAR(180) NOT NULL,
    rfc VARCHAR(20) NULL,
    email1 VARCHAR(120) NULL,
    email2 VARCHAR(120) NULL,
    celular VARCHAR(40) NULL,
    telefono VARCHAR(40) NULL,
    codigo_postal VARCHAR(20) NULL,
    ciudad VARCHAR(120) NULL,
    address TEXT NULL,
    has_client_portal_access TINYINT DEFAULT 0,
    portal_password_hash VARCHAR(255) NULL,
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_test_clients_business_name (business_name),
    CONSTRAINT fk_test_clients_users FOREIGN KEY (created_by_user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE clients_column_meta (
    column_name VARCHAR(128) NOT NULL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    display_order INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE client_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NULL,
    phone VARCHAR(40) NULL,
    position_title VARCHAR(80) NULL,
    has_portal_access TINYINT DEFAULT 0,
    portal_password_hash VARCHAR(255) NULL,
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_test_contacts_client_id (client_id),
    INDEX idx_test_contacts_email (email),
    CONSTRAINT fk_test_contacts_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(30) NULL UNIQUE,
    client_id INT NULL,
    name VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    product_type VARCHAR(20) NULL DEFAULT 'PRODUCT',
    current_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    users_count INT DEFAULT 0,
    description TEXT NULL,
    expires_at DATETIME NULL,
    is_active TINYINT DEFAULT 1,
    update_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_test_products_client_id (client_id),
    INDEX idx_test_products_name (name),
    CONSTRAINT fk_test_products_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE product_price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_test_history_product_id (product_id),
    CONSTRAINT fk_test_price_history_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE product_update_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    update_version INT NOT NULL DEFAULT 1,
    change_type VARCHAR(40) NOT NULL DEFAULT 'DETAILS',
    summary VARCHAR(255) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_test_product_update_history_product_id (product_id),
    CONSTRAINT fk_test_product_update_history_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    product_type VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(30) NULL,
    client_id INT NOT NULL,
    contact_id INT NULL,
    user_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'REQUESTED') DEFAULT 'PENDING',
    is_registered TINYINT NOT NULL DEFAULT 1,
    registered_at DATETIME NULL,
    notes TEXT NULL,
    is_sent_to_client_portal TINYINT DEFAULT 0,
    notification_read TINYINT DEFAULT 0,
    is_deleted_admin TINYINT DEFAULT 0,
    is_deleted_portal TINYINT DEFAULT 0,
    INDEX idx_test_quotes_client_id (client_id),
    INDEX idx_test_quotes_user_id (user_id),
    INDEX idx_test_quotes_contact_id (contact_id),
    INDEX idx_test_quotes_status (status),
    UNIQUE KEY uq_test_quotes_folio (folio),
    CONSTRAINT fk_test_quotes_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_quotes_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_test_quotes_contact FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    base_unit_price DECIMAL(10,2) NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    INDEX idx_test_quote_items_quote_id (quote_id),
    INDEX idx_test_quote_items_product_id (product_id),
    CONSTRAINT fk_test_quote_items_quotes FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_quote_items_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE client_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    product_id INT NOT NULL,
    license_key VARCHAR(100) NULL,
    start_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_client_products_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_client_products_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE contact_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    contact_id INT NOT NULL,
    product_id INT NOT NULL,
    license_key VARCHAR(100) NULL,
    start_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_contact_products_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_contact_products_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_contact_products_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_product_id INT NOT NULL UNIQUE,
    client_id INT NOT NULL,
    contact_id INT NOT NULL,
    product_id INT NOT NULL,
    folio VARCHAR(100) NULL,
    start_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_services_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_services_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_services_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_services_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_product_id INT NOT NULL UNIQUE,
    client_id INT NOT NULL,
    contact_id INT NOT NULL,
    product_id INT NOT NULL,
    folio VARCHAR(100) NULL,
    start_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_policies_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_policies_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_policies_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_policies_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export function assertSafeTestDatabaseName(databaseName = process.env.MYSQL_DATABASE) {
  const normalized = String(databaseName || "").trim();
  if (!normalized) throw new Error("MYSQL_DATABASE is required for database integration tests.");
  if (process.env.ALLOW_NON_TEST_DATABASE === "true") return normalized;
  if (!/(^test_|_test$)/i.test(normalized)) {
    throw new Error(
      `Refusing to reset non-test database "${normalized}". Use a database ending in _test or set ALLOW_NON_TEST_DATABASE=true intentionally.`,
    );
  }
  return normalized;
}

export async function ensureTestDatabase(databaseName = TEST_DATABASE_NAME) {
  const safeDatabase = assertSafeTestDatabaseName(databaseName);
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: false,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${safeDatabase.replace(/`/g, "``")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }

  return safeDatabase;
}

export async function resetTestDatabase(queryRunner = pool) {
  assertSafeTestDatabaseName(process.env.MYSQL_DATABASE);
  await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of DROP_TABLES) {
    await queryRunner.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1");

  for (const statement of SCHEMA_STATEMENTS) {
    await queryRunner.query(statement);
  }
}

export async function seedTestActors(queryRunner = pool) {
  await queryRunner.query("INSERT INTO roles (name) VALUES ('ADMIN'), ('VENTAS'), ('SOPORTE'), ('CONTACTO')");

  const [adminRoleRows] = await queryRunner.query("SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1");
  const adminRoleId = adminRoleRows[0].id;

  const [adminResult] = await queryRunner.query(
    `INSERT INTO users (role_id, full_name, email, telefono, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [adminRoleId, "Integration Admin", TEST_ADMIN_EMAIL, "555-0000", ADMIN_PASSWORD_HASH],
  );

  const adminUserId = adminResult.insertId;

  const [clientResult] = await queryRunner.query(
    `INSERT INTO clients (created_by_user_id, business_name, rfc, email1, celular, telefono, codigo_postal, ciudad)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      adminUserId,
      "Integration Client S.A.",
      "XAXX010101000",
      "client@businesscontrol.test",
      "555-1111",
      "555-2222",
      "44100",
      "Guadalajara",
    ],
  );

  const clientId = clientResult.insertId;

  const [contactResult] = await queryRunner.query(
    `INSERT INTO client_contacts (client_id, full_name, email, phone, position_title, has_portal_access, portal_password_hash)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [clientId, "Integration Portal Contact", TEST_PORTAL_EMAIL, "555-3333", "QA Contact", PORTAL_PASSWORD_HASH],
  );

  return {
    adminUserId,
    adminEmail: TEST_ADMIN_EMAIL,
    adminPassword: TEST_ADMIN_PASSWORD,
    clientId,
    contactId: contactResult.insertId,
    portalEmail: TEST_PORTAL_EMAIL,
    portalPassword: TEST_PORTAL_PASSWORD,
  };
}

export async function prepareIsolatedTestDatabase() {
  await resetTestDatabase();
  return seedTestActors();
}
