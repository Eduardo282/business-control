import { pool } from "../../config/db.js";
import { forbidden } from "../../errors/appErrors.js";
import {
  bulkCreateContacts,
  createContact,
  deleteContactProduct,
  deleteContactProductForContact,
  findContactById,
  findContactProductForContact,
  findContactsByEmail,
  insertContactProduct,
  listContactProducts,
  listContactsByClient,
  softDeleteContact,
  updateContact,
} from "../../repositories/contact.repository.js";
import { findProductByIdLean } from "../../repositories/product.repository.js";
import {
  insertProductFulfillmentRecord,
  resolveProductFulfillmentTarget,
} from "../../services/productFulfillmentRegistry.service.js";
import { sendEmail } from "../../utils/email.js";
import { signToken, verifyToken } from "../../utils/jwt.js";
import { logger } from "../../utils/logger.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import {
  determineStatus,
  isServiceOrPolicy,
  normalizeProductType,
} from "../../utils/policyStatus.js";

const POLICY_ALLOWED_STATUS = new Set(["ACTIVE", "EXPIRED", "CANCELLED"]);

function normalizeStoredStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();
  return POLICY_ALLOWED_STATUS.has(normalized) ? normalized : "ACTIVE";
}

/**
 * Lists contacts associated with a specific client ID.
 * @param {object|string|number} clientIdOrObj
 * @returns {Promise<Array<object>>}
 */
export async function listContactsByClientAction(clientIdOrObj) {
  const clientId =
    typeof clientIdOrObj === "object" && clientIdOrObj !== null
      ? (clientIdOrObj.client_id ?? clientIdOrObj.id)
      : clientIdOrObj;
  return listContactsByClient(clientId);
}

/**
 * Fetches a contact by ID.
 * @param {object} params
 * @param {string|number} params.id
 * @returns {Promise<object|null>}
 */
export async function getContactAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  return findContactById(id);
}

/**
 * Creates a contact record.
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function createContactAction(payload) {
  const insertId = await createContact(payload);
  return findContactById(insertId);
}

/**
 * Updates a contact record with optional portal password hashing & welcome email dispatch.
 */
export async function updateContactAction(id, input) {
  const targetId = typeof id === "object" && id?.id !== undefined ? id.id : id;
  const targetInput = typeof id === "object" && id?.input !== undefined ? id.input : (input || id || {});

  const {
    full_name,
    email,
    phone,
    position_title,
    has_portal_access,
    portal_password,
  } = targetInput;

  const data = {};

  if (full_name !== undefined) data.full_name = full_name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (position_title !== undefined) data.position_title = position_title;
  if (has_portal_access !== undefined) {
    data.has_portal_access = has_portal_access ? 1 : 0;
  }

  if (portal_password && has_portal_access !== false) {
    const hash = await hashPassword(portal_password);
    data.portal_password_hash = hash;
  }

  if (Object.keys(data).length > 0) {
    await updateContact(targetId, data);
  }

  const contact = await findContactById(targetId);

  if (portal_password && contact?.email) {
    const subject = "¡Bienvenido a Business Control! - Tu Acceso al Portal";
    const portalUrl = "http://localhost:5173/portal/login";
    const text = `Hola ${contact.full_name},\n\nTe damos la bienvenida al portal de clientes de Business Control.\n\nTus credenciales de acceso:\n- Correo: ${contact.email}\n- Contraseña provisional: ${portal_password}\n\nIngresa al portal aquí: ${portalUrl}\n\nPuedes cambiar tu contraseña al ingresar.\n\nSaludos,\nEl equipo de Business Control`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
         <h2 style="color: #4f46e5;">¡Bienvenido, ${contact.full_name}!</h2>
         <p>Acabas de unirte al portal de clientes de <strong>Business Control</strong>, en donde disfrutarás de tus cotizaciones y podrás tener mejor comunicación con nosotros.</p>
         <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <p style="margin: 0; font-weight: bold;">Tus credenciales de acceso:</p>
           <table style="margin: 10px 0; border-collapse: collapse;">
             <tr>
               <td style="padding: 4px 12px 4px 0; font-weight: bold; color: #555;">Correo:</td>
               <td style="padding: 4px 0; font-family: monospace; color: #4f46e5;">${contact.email}</td>
             </tr>
             <tr>
               <td style="padding: 4px 12px 4px 0; font-weight: bold; color: #555;">Contraseña:</td>
               <td style="padding: 4px 0; font-size: 20px; font-family: monospace; color: #4f46e5;">${portal_password}</td>
             </tr>
           </table>
         </div>
         <p>Ingresa al portal haciendo clic en el siguiente enlace:</p>
         <p style="margin: 16px 0;"><a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Ir al Portal</a></p>
         <p style="font-size: 12px; color: #888;">O copia este enlace en tu navegador: <a href="${portalUrl}" style="color: #4f46e5;">${portalUrl}</a></p>
         <p>Puedes cambiar tu contraseña en tu portal al ingresar.</p>
         <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
         <p style="font-size: 12px; color: #888;">Si no solicitaste este acceso, por favor ignora este correo.</p>
      </div>
    `;

    void sendEmail(contact.email, subject, text, html).catch((error) => {
      logger.error("Error enviando correo de bienvenida:", error);
    });
  }

  return {
    ...contact,
    has_portal_access: Boolean(contact?.has_portal_access),
  };
}

/**
 * Disables a contact record by ID without deleting it.
 * Snapshots contact_name on quotes and sales before changing the contact state.
 * @param {object|string|number} idOrObj
 * @returns {Promise<boolean>}
 */
export async function deleteContactAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  if (!id) return false;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE quotes q
       JOIN client_contacts cc ON q.contact_id = cc.id
       SET q.contact_name = COALESCE(q.contact_name, cc.full_name)
       WHERE q.contact_id = ?`,
      [id],
    );
    await connection.query(
      `UPDATE sales s
       JOIN client_contacts cc ON s.contact_id = cc.id
       SET s.contact_name = COALESCE(s.contact_name, cc.full_name)
       WHERE s.contact_id = ?`,
      [id],
    );

    const disabled = await softDeleteContact(id, connection);

    await connection.commit();
    return disabled;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Bulk creates contact records.
 * @param {object} payload
 * @param {Array<object>} payload.inputs
 * @returns {Promise<Array<object>>}
 */
export async function bulkCreateContactsAction({ inputs }) {
  return bulkCreateContacts(inputs);
}

/**
 * Creates a contact product / service assignment.
 */
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
    await connection.beginTransaction();
    txStarted = true;

    const contact = await findContactById(contact_id, connection);
    if (!contact) throw new Error("Contact not found");
    const client_id = contact.client_id;
    const normalizedStatus = normalizeStoredStatus(status);

    const product = await findProductByIdLean(product_id, connection);
    if (!product) {
      throw new Error("Product not found");
    }

    const target = resolveProductFulfillmentTarget(product);

    const contactProductId = await insertContactProduct(
      {
        client_id,
        contact_id,
        product_id,
        license_key,
        start_date,
        expiration_date,
        status: normalizedStatus,
      },
      connection,
    );

    await insertProductFulfillmentRecord(connection, target, {
      contact_product_id: contactProductId,
      client_id,
      contact_id,
      product_id,
      folio: license_key,
      start_date,
      expiration_date,
      status: normalizedStatus,
    });

    await connection.commit();

    return {
      id: contactProductId,
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

/**
 * Lists services / products assigned to a contact.
 */
export async function listContactProductsAction(contact_id) {
  const rows = await listContactProducts(contact_id);

  return rows
    .filter((row) => isServiceOrPolicy(row))
    .map((row) => ({
      id: row.id,
      contact_id: row.contact_id,
      license_key: row.license_key,
      start_date: row.start_date && !isNaN(new Date(row.start_date)) ? new Date(row.start_date).toISOString() : null,
      expiration_date: row.expiration_date && !isNaN(new Date(row.expiration_date)) ? new Date(row.expiration_date).toISOString() : null,
      status: determineStatus(row.status, row.expiration_date),
      product: {
        id: row.product_id,
        folio: row.product_folio,
        name: row.product_name,
        category: row.product_category,
        description: row.product_description,
        current_price: row.current_price,
        is_active: Boolean(row.is_active),
        product_type: normalizeProductType(row),
      },
    }));
}

/**
 * Deletes a contact product assignment.
 */
export async function deleteContactProductAction(id) {
  await deleteContactProduct(id);
  return true;
}

/**
 * Deletes a portal service product for the authenticated portal contact.
 */
export async function deletePortalContactProductAction(id, user) {
  const connection = await pool.getConnection();

  try {
    const row = await findContactProductForContact(
      id,
      user.contactId,
      connection,
    );

    if (!row) {
      throw new Error("Servicio o póliza no encontrado.");
    }

    if (!isServiceOrPolicy(row)) {
      throw forbidden("Solo puedes eliminar servicios o pólizas.");
    }

    const affected = await deleteContactProductForContact(
      id,
      user.contactId,
      connection,
    );

    return affected > 0;
  } finally {
    connection.release();
  }
}

/**
 * Authenticates a portal contact via email and password.
 */
export async function loginContactAction({ email, password }) {
  const rows = await findContactsByEmail(email);

  if (rows.length === 0) {
    throw new Error("Credenciales inválidas o acceso al portal no habilitado.");
  }

  let matchedContact = null;
  for (const contact of rows) {
    if (!contact.portal_password_hash) continue;
    const isValid = await comparePassword(password, contact.portal_password_hash);
    if (isValid) {
      matchedContact = contact;
      break;
    }
  }

  if (!matchedContact) {
    throw new Error("Credenciales inválidas.");
  }

  const token = signToken({
    contactId: matchedContact.id,
    clientId: matchedContact.client_id,
    role: "CONTACT_PORTAL",
  });

  return {
    token,
    contact: {
      ...matchedContact,
      has_portal_access: !!matchedContact.has_portal_access,
    },
  };
}

/**
 * Changes password while authenticated in portal.
 */
export async function changePortalPasswordAction({
  contactId,
  currentPassword,
  newPassword,
}) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  const contact = await findContactById(contactId);
  if (!contact || !contact.has_portal_access) {
    throw new Error("Contacto no encontrado o sin acceso al portal.");
  }

  const isValid = await comparePassword(currentPassword, contact.portal_password_hash);
  if (!isValid) {
    throw new Error("La contraseña actual es incorrecta.");
  }

  const hash = await hashPassword(newPassword);
  await updateContact(contactId, { portal_password_hash: hash });

  return true;
}

/**
 * Requests a password reset token via email.
 */
export async function requestPortalPasswordResetAction({ email }) {
  const contacts = await findContactsByEmail(email);

  if (!contacts.length) return true;

  const contact = contacts[0];

  const resetToken = signToken({
    contactId: contact.id,
    purpose: "portal_password_reset",
  });

  const portalUrl = "http://localhost:5173/portal/reset-password";
  const resetUrl = `${portalUrl}?token=${resetToken}`;

  const subject = "Restablecer contraseña — Business Control";
  const text = `Hola ${contact.full_name},\n\nRecibimos una solicitud para restablecer tu contraseña del portal de Business Control.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n${resetUrl}\n\nEste enlace expira en 15 minutos.\n\nSi no solicitaste esto, ignora este correo.\n\nSaludos,\nEl equipo de Business Control`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
       <h2 style="color: #4f46e5;">Restablecer contraseña</h2>
       <p>Hola <strong>${contact.full_name}</strong>,</p>
       <p>Recibimos una solicitud para restablecer tu contraseña del portal de <strong>Business Control</strong>.</p>
       <p style="margin: 24px 0;">
         <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #235b42; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Restablecer contraseña</a>
       </p>
       <p style="font-size: 12px; color: #888;">O copia este enlace en tu navegador:<br/><a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a></p>
       <p style="font-size: 12px; color: #888;">Este enlace expira en 15 minutos.</p>
       <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
       <p style="font-size: 12px; color: #888;">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
    </div>
  `;

  void sendEmail(contact.email, subject, text, html).catch((error) => {
    logger.error("Error enviando correo de reset de contraseña:", error);
  });

  return true;
}

/**
 * Resets password using token.
 */
export async function resetPortalPasswordAction({ token, newPassword }) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new Error("El enlace ha expirado o es inválido. Solicita uno nuevo.");
  }

  if (payload.purpose !== "portal_password_reset") {
    throw new Error("Token inválido.");
  }

  const contact = await findContactById(payload.contactId);
  if (!contact || !contact.has_portal_access) {
    throw new Error("Contacto no encontrado o sin acceso al portal.");
  }

  const hash = await hashPassword(newPassword);
  await updateContact(contact.id, { portal_password_hash: hash });

  return true;
}
