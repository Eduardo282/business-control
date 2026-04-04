import { pool } from "../../../config/db.js";
import { hashPassword } from "../../../utils/password.js";

export async function registerUserAction({
  full_name,
  email,
  telefono,
  password,
  role_name,
}) {
  const role = role_name?.trim().toUpperCase();
  const phone = telefono?.trim();

  if (!phone) {
    throw new Error("El teléfono es requerido");
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\+\-=\[\]{}|;:,.<>?/]).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error(
      "La contraseña debe tener mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos especiales.",
    );
  }

  // El rol debe existir en la tabla de roles
  const [roleRows] = await pool.query(
    `SELECT id, name FROM roles WHERE name = :role LIMIT 1`,
    { role },
  );
  const foundRole = roleRows?.[0];

  if (!foundRole) {
    throw new Error("El rol seleccionado no existe");
  }

  const password_hash = await hashPassword(password);

  // Buscar usuario existente con ese rol
  const [userRows] = await pool.query(
    `SELECT id FROM users WHERE role_id = :role_id LIMIT 1`,
    { role_id: foundRole.id },
  );
  const existingUser = userRows?.[0];

  if (existingUser) {
    // Actualizar credenciales del usuario existente
    await pool.query(
      `UPDATE users 
       SET full_name = :full_name, email = :email, telefono = :telefono, password_hash = :password_hash, updated_at = NOW()
       WHERE id = :user_id`,
      {
        user_id: existingUser.id,
        full_name,
        email,
        telefono: phone,
        password_hash,
      },
    );

    return {
      id: existingUser.id,
      full_name,
      email,
      telefono: phone,
      role: { id: foundRole.id, name: foundRole.name },
    };
  } else {
    // Crear nuevo usuario con el rol
    const [insertUser] = await pool.query(
      `INSERT INTO users (full_name, email, telefono, password_hash, role_id, created_at, updated_at)
       VALUES (:full_name, :email, :telefono, :password_hash, :role_id, NOW(), NOW())`,
      {
        full_name,
        email,
        telefono: phone,
        password_hash,
        role_id: foundRole.id,
      },
    );

    return {
      id: insertUser.insertId,
      full_name,
      email,
      telefono: phone,
      role: { id: foundRole.id, name: foundRole.name },
    };
  }
}
