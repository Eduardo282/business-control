import { pool } from "../../../config/db.js";

const POLICY_ALLOWED_STATUS = new Set(["ACTIVE", "EXPIRED", "CANCELLED"]);
let servicePolicyTablesEnsured = false;

function normalizeStoredStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();
  return POLICY_ALLOWED_STATUS.has(normalized) ? normalized : "ACTIVE";
}

function normalizeCategory(category = "") {
  return String(category)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function resolveServicePolicyTable(productCategory) {
  const normalizedCategory = normalizeCategory(productCategory);

  if (normalizedCategory === "servicio personalizado") {
    return "services";
  }

  if (normalizedCategory === "poliza personalizada") {
    return "policies";
  }

  return null;
}

async function ensureServicePolicyTables(connection) {
  if (servicePolicyTablesEnsured) {
    return;
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS services (
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
      CONSTRAINT fk_services_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
      CONSTRAINT fk_services_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      CONSTRAINT fk_services_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
      CONSTRAINT fk_services_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS policies (
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
      CONSTRAINT fk_policies_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
      CONSTRAINT fk_policies_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      CONSTRAINT fk_policies_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
      CONSTRAINT fk_policies_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  servicePolicyTablesEnsured = true;
}

export async function createContactProductAction({
  contact_id,
  product_id,
  license_key,
  start_date,
  expiration_date,
  status,
}) {
  const connection = await pool.getConnection();
  let txStarted = false;

  try {
    await ensureServicePolicyTables(connection);
    await connection.beginTransaction();
    txStarted = true;

    // Obtener client_id del contacto
    const [contacts] = await connection.query(
      "SELECT client_id FROM client_contacts WHERE id = ?",
      [contact_id],
    );
    if (contacts.length === 0) throw new Error("Contact not found");
    const client_id = contacts[0].client_id;
    const normalizedStatus = normalizeStoredStatus(status);

    const [products] = await connection.query(
      "SELECT category FROM products WHERE id = :product_id",
      { product_id },
    );

    if (!products.length) {
      throw new Error("Product not found");
    }

    const targetTable = resolveServicePolicyTable(products[0].category);

    const [result] = await connection.query(
      `INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
       VALUES (:client_id, :contact_id, :product_id, :license_key, :start_date, :expiration_date, :status)`,
      {
        client_id,
        contact_id,
        product_id,
        license_key,
        start_date,
        expiration_date,
        status: normalizedStatus,
      },
    );

    if (targetTable) {
      await connection.query(
        `INSERT INTO ${targetTable} (
          contact_product_id,
          client_id,
          contact_id,
          product_id,
          folio,
          start_date,
          expiration_date,
          status
        ) VALUES (
          :contact_product_id,
          :client_id,
          :contact_id,
          :product_id,
          :folio,
          :start_date,
          :expiration_date,
          :status
        )`,
        {
          contact_product_id: result.insertId,
          client_id,
          contact_id,
          product_id,
          folio: license_key,
          start_date,
          expiration_date,
          status: normalizedStatus,
        },
      );
    }

    await connection.commit();

    return {
      id: result.insertId,
      client_id,
      contact_id,
      product_id,
      license_key,
      start_date,
      expiration_date,
      status: normalizedStatus,
    };
  } catch (error) {
    if (txStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}
