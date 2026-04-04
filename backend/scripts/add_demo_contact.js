import "dotenv/config";
import { pool } from "../src/config/db.js";
import { hashPassword } from "../src/utils/password.js";

async function createDemoContact() {
  const connection = await pool.getConnection();
  try {
    console.log("Creando contacto de demostración...");

    // 1. Obtener o crear un Cliente para asociar al contacto
    let [clients] = await connection.query("SELECT id FROM clients LIMIT 1");
    let clientId;

    if (clients.length === 0) {
      console.log("No se encontraron clientes. Creando un cliente de demostración...");
      // Necesitamos un usuario admin/ventas para crear el cliente (created_by_user_id)
      const [users] = await connection.query("SELECT id FROM users LIMIT 1");
      if (users.length === 0) {
        throw new Error(
          "No se encontraron usuarios para crear un cliente. Ejecuta add_demo_users.js primero."
        );
      }
      const [res] = await connection.query(
        `
        INSERT INTO clients (business_name, rfc, created_by_user_id) 
        VALUES ('Empresa Cliente Demo', 'XAXX010101000', ?)
      `,
        [users[0].id]
      );
      clientId = res.insertId;
    } else {
      clientId = clients[0].id;
    }

    // 2. Definir el contacto
    const contact = {
      email: "contacto@cliente.com",
      full_name: "Contacto Demo Portal",
      password: "Password123*",
      phone: "555-111-2222",
    };

    // 3. Hashear Password
    const hash = await hashPassword(contact.password);

    // 4. Insertar o Actualizar
    // Nota: Asegúrate de haber corrido 'scripts/migrate_contacts_portal.js' para tener las columnas de portal
    const [existing] = await connection.query(
      "SELECT id FROM client_contacts WHERE email = ?",
      [contact.email]
    );

    if (existing.length > 0) {
      console.log(
        `El contacto ${contact.email} ya existe. Actualizando acceso al portal...`
      );
      await connection.query(
        `
        UPDATE client_contacts 
        SET portal_password_hash = ?, has_portal_access = 1, full_name = ?
        WHERE email = ?
      `,
        [hash, contact.full_name, contact.email]
      );
    } else {
      console.log(`Creando contacto ${contact.email}...`);
      await connection.query(
        `
        INSERT INTO client_contacts 
        (client_id, full_name, email, phone, portal_password_hash, has_portal_access)
        VALUES (?, ?, ?, ?, ?, 1)
      `,
        [clientId, contact.full_name, contact.email, contact.phone, hash]
      );
    }

    console.log("Contacto de demostración creado/actualizado exitosamente.");
    console.log(`Email de inicio de sesión: ${contact.email}`);
    console.log(`Contraseña de inicio de sesión: ${contact.password}`);
  } catch (err) {
    if (err.code === "ER_BAD_FIELD_ERROR") {
      console.error(
        "\nERROR: Columna no encontrada. ¿Ejecutaste 'node scripts/migrate_contacts_portal.js'?"
      );
    }
    console.error("Error creando contacto de demostración:", err);
  } finally {
    connection.release();
    pool.end();
  }
}

createDemoContact();
