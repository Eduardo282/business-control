import "dotenv/config";
import { pool } from "../src/config/db.js";
import { hashPassword } from "../src/utils/password.js";

async function createUsers() {
  const connection = await pool.getConnection();
  try {
    console.log("Creando usuarios de demostración...");

    const rolesMap = {};
    const [roles] = await connection.query("SELECT id, name FROM roles");
    roles.forEach((r) => (rolesMap[r.name] = r.id));

    const users = [
      {
        email: "ventas@businesscontrol.com",
        name: "Vendedor Demo",
        password: "Password123*",
        role: "VENTAS",
      },
      {
        email: "soporte@businesscontrol.com",
        name: "Soporte Técnico",
        password: "Password123*",
        role: "SOPORTE",
      },
    ];

    for (const u of users) {
      const roleId = rolesMap[u.role];
      if (!roleId) {
        console.error(`Rol ${u.role} no encontrado`);
        continue;
      }

      const hash = await hashPassword(u.password);

      // Checar si existe
      const [existing] = await connection.query(
        "SELECT id FROM users WHERE email = ?",
        [u.email]
      );
      if (existing.length > 0) {
        console.log(`El usuario ${u.email} ya existe. Actualizando contraseña...`);
        await connection.query(
          "UPDATE users SET password_hash = ?, role_id = ? WHERE email = ?",
          [hash, roleId, u.email]
        );
      } else {
        console.log(`Creando usuario ${u.email}...`);
        await connection.query(
          "INSERT INTO users (role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)",
          [roleId, u.name, u.email, hash]
        );
      }
    }

    console.log("Usuarios creados exitosamente.");
  } catch (err) {
    console.error("Error creando usuarios:", err);
  } finally {
    connection.release();
    process.exit();
  }
}

createUsers();
