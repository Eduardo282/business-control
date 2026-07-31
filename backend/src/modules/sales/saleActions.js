import { pool } from "../../config/db.js";
import {
  createSale,
  findAcceptedQuoteForSale,
  findQuoteItemsForSale,
  findSaleById,
  findSaleItemsBySaleId,
  findSoldQuoteItemIds,
  insertSaleItems,
  listPortalSalesByContact,
  listSales,
  listSalesByUserId,
  softDeletePortalSale,
  softDeleteSale,
  updateSaleFolio,
  updateSalePortalStatus,
  markSaleEmailSent,
} from "../../repositories/sale.repository.js";
import { findContactById } from "../../repositories/contact.repository.js";
import { sendEmail } from "../../utils/email.js";

function resolveUserId(user) {
  return user?.id || user?.userId || null;
}

function buildSaleFolio(saleId) {
  return `VTA-${String(saleId).padStart(6, "0")}`;
}

/**
 * Lists all sales records.
 * @returns {Promise<Array<object>>}
 */
export async function listSalesAction() {
  return listSales();
}

/**
 * Lists portal sales for a given contact ID.
 * @param {string|number} contactId
 * @returns {Promise<Array<object>>}
 */
export async function listPortalSalesAction(contactId) {
  return listPortalSalesByContact(contactId);
}

/**
 * Lists sales for a specific sales user ID.
 * @param {string|number} userId
 * @returns {Promise<Array<object>>}
 */
export async function listSalesByUserAction(userId) {
  return listSalesByUserId(userId);
}

/**
 * Fetches a single sale by ID.
 * @param {object} params
 * @param {string|number} params.id
 * @returns {Promise<object|null>}
 */
export async function getSaleAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  return findSaleById(id);
}

/**
 * Creates a sale record from a quote and its selected items.
 * @param {object} input
 * @param {object} [user]
 * @returns {Promise<object>}
 */
export async function createSaleFromQuoteAction(input, user) {
  const quoteId = input?.quote_id;
  const quoteItemIds = Array.from(
    new Set((input?.quote_item_ids || []).map((id) => String(id))),
  );

  if (!quoteId) throw new Error("La cotización es requerida.");
  if (!quoteItemIds.length) {
    throw new Error("Selecciona al menos un producto para vender.");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const quote = await findAcceptedQuoteForSale(quoteId, connection);
    if (!quote) {
      throw new Error("Solo se pueden vender productos de cotizaciones aceptadas.");
    }

    const quoteItems = await findQuoteItemsForSale({
      quoteId,
      quoteItemIds,
    }, connection);

    if (quoteItems.length !== quoteItemIds.length) {
      throw new Error("Uno o más productos no pertenecen a la cotización.");
    }

    const soldItemIds = await findSoldQuoteItemIds({ quoteItemIds }, connection);
    if (soldItemIds.length > 0) {
      throw new Error("Uno o más productos ya fueron vendidos.");
    }

    const total = quoteItems.reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0,
    );
    const saleId = await createSale({
      quote_id: quote.id,
      client_id: quote.client_id,
      contact_id: quote.contact_id,
      user_id: resolveUserId(user),
      total,
      notes: input?.notes || null,
    }, connection);

    await insertSaleItems(connection, {
      saleId,
      items: quoteItems,
    });

    await updateSaleFolio({
      saleId,
      folio: buildSaleFolio(saleId),
      queryRunner: connection,
    });

    await connection.commit();
    
    const createdSale = await findSaleById(saleId);

    // Automatically enable portal access and send email notification
    if (quote.contact_id) {
      try {
        await updateSalePortalStatus({
          saleId: saleId,
          isSentToClientPortal: 1,
          contactId: quote.contact_id,
        });

        const contact = await findContactById(quote.contact_id);
        if (contact && contact.email) {
          const subject = `Venta #${createdSale.folio} Generada`;
          const text = `Se ha generado la venta #${createdSale.folio}. Puedes consultarla en tu portal.`;
          const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #059669;">¡Venta Generada Exitosamente!</h2>
              <p>Hola <strong>${contact.full_name || "Cliente"}</strong>,</p>
              <p>Le notificamos que se ha generado la venta <strong>#${createdSale.folio}</strong> por un total de <strong>$${createdSale.total}</strong>.</p>
              <p>Esta venta ya se encuentra disponible para su consulta en su portal de cliente.</p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Gracias por su preferencia.</p>
            </div>
          `;
          await sendEmail(contact.email, subject, text, html);
        }
      } catch (e) {
        // Non-fatal if email/portal fails, the sale was already generated
        console.error("Error auto-sending sale to portal/email:", e);
      }
    }

    return await findSaleById(saleId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Deletes a sale record.
 * @param {object|string|number} id
 * @returns {Promise<boolean>}
 */
export async function deleteSaleAction(id) {
  const targetId = typeof id === "object" ? id?.id : id;
  const rowsAffected = await softDeleteSale({ saleId: targetId });
  return rowsAffected > 0;
}

/**
 * Deletes a portal sale record for a specific contact.
 * @param {object} params
 * @param {string|number} params.id
 * @param {string|number} params.contactId
 * @returns {Promise<boolean>}
 */
export async function deletePortalSaleAction({ id, contactId }) {
  const rowsAffected = await softDeletePortalSale({ saleId: id, contactId });
  return rowsAffected > 0;
}

/**
 * Sends an email with the sale details.
 * @param {object} input
 * @param {string|number} input.sale_id
 * @param {string} input.contact_email
 * @param {string} input.message
 * @returns {Promise<object>}
 */
export async function sendSaleEmailAction({ sale_id, contact_email, message }) {
  if (!contact_email) throw new Error("El correo de contacto es requerido.");

  const sale = await findSaleById(sale_id);
  if (!sale) throw new Error("Venta no encontrada.");

  const folio = sale.folio || `#${sale.id}`;
  const subject = `Venta ${folio} - Business Control`;
  const text = message || `Se generó la venta ${folio}.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2>Venta ${folio}</h2>
      <p>${String(text).replace(/\n/g, "<br />")}</p>
      <p><strong>Total:</strong> $${Number(sale.total || 0).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
      })}</p>
    </div>
  `;

  await sendEmail(contact_email, subject, text, html);
  await markSaleEmailSent(sale_id);

  return {
    success: true,
    message: "Venta enviada correctamente.",
    email_sent_at: new Date().toISOString(),
  };
}

/**
 * Toggles portal access for a sale.
 * @param {string|number} id - The sale ID.
 * @param {boolean} access - Whether to grant portal access.
 * @param {string|number} contactId - The contact ID.
 * @returns {Promise<object>}
 */
export async function toggleSalePortalAction(id, access, contactId) {
  const isSentToClientPortal = access ? 1 : 0;
  
  const rowsAffected = await updateSalePortalStatus({
    saleId: id,
    isSentToClientPortal,
    contactId,
  });

  if (!rowsAffected) {
    throw new Error("No se pudo actualizar el acceso al portal de la venta.");
  }

  return await findSaleById(id);
}

/**
 * Retrieves the items associated with a sale.
 * @param {string|number} saleId
 * @returns {Promise<Array<object>>}
 */
export async function getSaleItemsAction(saleId) {
  return findSaleItemsBySaleId(saleId);
}

