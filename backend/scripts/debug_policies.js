import "dotenv/config";
import { pool } from "../src/config/db.js";
import { createContactProductAction } from "../src/graphql/actions/contact_actions/createContactProduct.action.js";
import { listContactProductsAction } from "../src/graphql/actions/contact_actions/listContactProducts.action.js";

async function testFlow() {
  const conn = await pool.getConnection();
  try {
    // 1. Crear un cliente de prueba
    const [c] = await conn.query(
      "INSERT INTO clients (created_by_user_id, business_name, has_client_portal_access) VALUES (1, 'Test Client For Policies', 0)"
    );
    const client_id = c.insertId;
    console.log("Cliente creado:", client_id);

    // 2. Crear un contacto de prueba
    const [ct] = await conn.query(
      "INSERT INTO client_contacts (client_id, full_name, email) VALUES (?, 'Test Contact', 'test@test.com')",
      [client_id]
    );
    const contact_id = ct.insertId;
    console.log("Contacto creado:", contact_id);

    // 3. Crear un producto de prueba
    const [p] = await conn.query(
      "INSERT INTO products (client_id, name, category, current_price) VALUES (?, 'Test Policy Product', 'Services', 100.00)",
      [client_id]
    );
    const product_id = p.insertId;
    console.log("Producto creado:", product_id);

    // 4. Crear producto de contacto (Acción)
    console.log("Creando producto de contacto...");
    const result = await createContactProductAction({
      contact_id,
      product_id,
      license_key: "TEST-KEY-123",
      start_date: "2024-01-01",
      expiration_date: "2025-01-01",
    });
    console.log("Resultado de la creación:", result);

    // 5. Listar
    console.log("Listando productos de contacto...");
    const list = await listContactProductsAction(contact_id);
    console.log("Resultado de la lista:", list);
  } catch (error) {
    console.error("Test fallido:", error);
  } finally {
    conn.release();
    process.exit();
  }
}

testFlow();
