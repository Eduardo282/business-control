import { pool } from "../../../config/db.js";
import { ensureQuoteItemDiscountColumnsAction } from "./ensureQuoteItemDiscountColumns.action.js";

let servicePolicyTablesEnsured = false;

function normalizeCategory(category = "") {
  return String(category)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function resolveServicePolicyTable(productCategory, productName = "") {
  const normalizedCategory = normalizeCategory(productCategory);
  const normalizedName = normalizeCategory(productName);

  if (normalizedName.includes("poliza")) {
    return "policies";
  }

  if (normalizedName.includes("servicio")) {
    return "services";
  }

  if (normalizedCategory.includes("servicio")) {
    return "services";
  }

  if (normalizedCategory.includes("poliza")) {
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

export const resolveQuoteRequestAction = async (requestId, input, user) => {
  const { client_id, contact_id, items, notes, folio: inputFolio } = input;
  let supportsDiscountColumns = false;

  try {
    supportsDiscountColumns = await ensureQuoteItemDiscountColumnsAction();
  } catch (error) {
    console.warn(
      "No se pudieron asegurar columnas de descuento en quote_items:",
      error.message,
    );
  }

  const connection = await pool.getConnection();

  try {
    if (contact_id) {
      await ensureServicePolicyTables(connection);
    }

    await connection.beginTransaction();

    // 1. Verificar que la solicitud exista
    const [existing] = await connection.query(
      "SELECT id FROM quotes WHERE id = ? AND status = 'REQUESTED'",
      [requestId],
    );
    if (existing.length === 0) {
      throw new Error("Solicitud no válida o ya procesada");
    }

    // 2. Calcular totales
    let quoteTotal = 0;
    const finalItems = [];

    for (const item of items) {
      const [rows] = await connection.query(
        "SELECT id, name, category, current_price FROM products WHERE id = ?",
        [item.product_id],
      );
      if (rows.length === 0) {
        throw new Error(`Producto con ID ${item.product_id} no encontrado`);
      }
      const product = rows[0];
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const inputUnitPrice = Number(item.unit_price);
      const productPrice = Number(product.current_price);
      const basePrice =
        Number.isFinite(inputUnitPrice) && inputUnitPrice > 0 ?
          inputUnitPrice
        : productPrice;
      const discount = Math.min(100, Math.max(0, Number(item.discount || 0)));
      const base_unit_price = Number(basePrice.toFixed(2));
      const unit_price = Number(
        (base_unit_price * (1 - discount / 100)).toFixed(2),
      );
      const lineTotal = Number((unit_price * quantity).toFixed(2));

      quoteTotal += lineTotal;
      finalItems.push({
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        quantity,
        base_unit_price,
        unit_price,
        discount,
        total: lineTotal,
      });
    }

    quoteTotal = Number(quoteTotal.toFixed(2));

    // 3. Actualizar la cotización existente (REQUESTED -> PENDING) y asignar usuario admin
    const userId = user.id || user.userId;
    const folio =
      inputFolio ||
      `COT-GEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await connection.query(
      `UPDATE quotes 
       SET folio = ?, client_id = ?, contact_id = ?, user_id = ?, total = ?, notes = ?, status = 'PENDING', created_at = NOW() 
       WHERE id = ?`,
      [
        folio,
        client_id,
        contact_id || null,
        userId,
        quoteTotal,
        notes,
        requestId,
      ],
    );

    // 4. Reemplazar items (Borrar viejos -> Insertar nuevos)
    //    Es más limpio borrar todo y volver a insertar que intentar actualizar uno por uno
    await connection.query("DELETE FROM quote_items WHERE quote_id = ?", [
      requestId,
    ]);

    for (const item of finalItems) {
      if (supportsDiscountColumns) {
        await connection.query(
          `INSERT INTO quote_items (quote_id, product_id, quantity, base_unit_price, unit_price, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            requestId,
            item.product_id,
            item.quantity,
            item.base_unit_price,
            item.unit_price,
            item.discount,
            item.total,
          ],
        );
      } else {
        await connection.query(
          `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)`,
          [
            requestId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total,
          ],
        );
      }
    }

    // 5. Borrar productos (polizas) activos de prueba si se generaron en request (opcional, pero requestQuote no genera polizas)
    //    Sin embargo, createQuoteAction sí genera pólizas AUTOMÁTICAS. Aquí DEBERÍAMOS generarlas también.

    // Generar Pólizas automáticas si hay contacto
    if (contact_id) {
      const startDate = new Date();

      for (const item of finalItems) {
        const expirationDate = new Date(startDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        for (let i = 0; i < item.quantity; i++) {
          const licenseKey =
            Math.random().toString(36).substring(2, 8).toUpperCase() +
            "-" +
            Date.now().toString().substring(9) +
            (i > 0 ? `-${i}` : "");

          const [contactProductInsert] = await connection.query(
            `INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [
              client_id,
              contact_id,
              item.product_id,
              licenseKey,
              startDate,
              expirationDate,
            ],
          );

          const targetTable = resolveServicePolicyTable(
            item.product_category,
            item.product_name,
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
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
              [
                contactProductInsert.insertId,
                client_id,
                contact_id,
                item.product_id,
                licenseKey,
                startDate,
                expirationDate,
              ],
            );
          }
        }
      }
    }

    await connection.commit();

    return {
      id: requestId,
      folio,
      client_id,
      user_id: userId,
      total: quoteTotal,
      status: "PENDING",
      notes,
      created_at: new Date(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
