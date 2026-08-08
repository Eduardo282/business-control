import { pool } from "../../config/db.js";
import { findUserWithRole } from "../../repositories/user.repository.js";
import {
  createSale,
  deleteSale,
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rowsAffected = await deleteSale({
      saleId: targetId,
      queryRunner: connection,
    });
    await connection.commit();
    return rowsAffected > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

  const [items] = await pool.query(
    `SELECT si.product_id, si.quantity, p.name AS product_name
     FROM sale_items si
     LEFT JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?
     ORDER BY si.id ASC`,
    [sale_id],
  );
  const seller = sale.user_id ? await findUserWithRole(sale.user_id) : null;

  const folio = sale.folio || `#${sale.id}`;
  const subject = `Venta ${folio} - Business Control`;
  const textMessage = message || `Se generó la venta ${folio}.`;

  const escapeHtml = (str) =>
    String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const contactName = escapeHtml(sale.contact_name || "Estimado cliente");
  const sellerName = escapeHtml(seller?.full_name || "Equipo de Ventas");
  const sellerEmail = escapeHtml(seller?.email || "ventas@businesscontrol.com");
  const htmlMessage = escapeHtml(textMessage).replace(/\n/g, "<br>");

  const totalNum = Number(sale.total || 0);
  const totalFormatted = `$${totalNum.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  const itemCount = items.length;

  const saleDate = sale.created_at
    ? new Date(sale.created_at).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  const topItems = items.slice(0, 3);
  const valuePointsHtml = topItems.length > 0
    ? topItems
        .map(
          (item) =>
            `<tr>
              <td style="padding: 6px 0; vertical-align: top; width: 20px; color: #34d399; font-size: 16px; font-weight: bold;">✓</td>
              <td style="padding: 6px 0; color: #334155; font-size: 14px;">${escapeHtml(item.product_name || `Producto #${item.product_id}`)} <span style="color: #94a3b8;">×${item.quantity || 1}</span></td>
            </tr>`,
        )
        .join("")
    : "";

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <!-- HEADER -->
      <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 4px solid #34d399;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Business Control</h1>
        <p style="color: #94a3b8; margin: 6px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Confirmación de Venta</p>
      </div>

      <!-- BODY -->
      <div style="padding: 32px 28px;">
        <!-- Greeting -->
        <p style="color: #0f172a; font-size: 16px; margin: 0 0 20px 0; font-weight: 600;">
          Estimado/a ${contactName},
        </p>

        <!-- Executive Summary Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Venta</p>
              <p style="margin: 4px 0 0; font-size: 16px; color: #0f172a; font-weight: 700; font-family: 'Courier New', monospace;">${escapeHtml(folio)}</p>
            </div>
          </div>

          <!-- Total Highlight -->
          <div style="background-color: #0f172a; border-radius: 8px; padding: 16px 20px; text-align: center; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total de la venta</p>
            <p style="margin: 6px 0 0; font-size: 28px; color: #34d399; font-weight: 800; font-family: 'Courier New', monospace;">${totalFormatted}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">${itemCount} concepto${itemCount !== 1 ? "s" : ""} · IVA incluido</p>
          </div>

          <!-- Sale Date -->
          <div style="text-align: center; padding: 8px 0;">
            <p style="margin: 0; font-size: 13px; color: #475569;">
              <strong style="color: #0f172a;">Fecha:</strong> ${saleDate}
            </p>
          </div>
        </div>

        ${
          valuePointsHtml
            ? `<!-- Value Points -->
        <div style="margin-bottom: 24px;">
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Incluye:</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${valuePointsHtml}
          </table>
          ${itemCount > 3 ? `<p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8; font-style: italic;">y ${itemCount - 3} concepto${itemCount - 3 !== 1 ? "s" : ""} más.</p>` : ""}
        </div>`
            : ""
        }

        <!-- Custom Message -->
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.7;">
            ${htmlMessage}
          </p>
        </div>

        <!-- Seller Signature -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 8px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${sellerName}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">${sellerEmail}</p>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">Business Control</p>
        </div>
      </div>

      <!-- EMAIL FOOTER -->
      <div style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #1e293b; font-weight: 700; margin: 0 0 4px 0; font-size: 13px;">Business Control S.A. de C.V.</p>
        <p style="color: #64748b; margin: 0 0 12px 0; font-size: 12px;">Av. Vallarta #1234, Col. Americana, Guadalajara, Jalisco, CP 44100</p>
        <p style="color: #94a3b8; margin: 0; font-size: 11px; line-height: 1.5; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          Este documento confidencial es de uso exclusivo para las personas a las que va dirigido.<br>
          Si usted recibió este correo por error, por favor elimínelo y comuníquelo al remitente.
        </p>
      </div>
    </div>
  `;

  await sendEmail(contact_email, subject, textMessage, html);
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
