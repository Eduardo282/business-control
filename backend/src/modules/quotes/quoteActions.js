import { calculateQuotePricing } from "../../../../shared/quotePricingRules.js";
import { getConnection } from "./infrastructure/quoteConnection.js";

import { insertContactProduct } from "../../repositories/contact.repository.js";
import {
  acceptResolvedQuoteRequest,
  countPendingQuoteRequests,
  createQuote,
  dismissAllQuoteNotifications,
  dismissQuoteNotification,
  deleteQuote,
  fetchProductsForQuote,
  findContactRequestedQuoteForUpdate,
  findPortalQuote,
  findQuoteById,
  findQuoteItemsByQuoteId,
  findUnreadQuoteRequests,
  insertQuoteItems,
  listAllNonRequestedQuotes,
  listPortalQuotesByContact,
  listQuotesByClientId,
  listQuotesByUserId,
  markQuoteEmailSent,
  markQuoteNotificationAsRead,
  registerQuote,
  replaceQuoteItems,
  resolveQuoteRequest,
  softDeletePortalQuote,
  updatePortalQuoteResponseStatus,
  updateQuotePortalStatus,
  updateQuoteStatus,
  updateQuoteTotal,
} from "../../repositories/quote.repository.js";
import { validateEmailDeliverability } from "../../services/emailValidator.service.js";

import { sendQuoteEmailMessage } from "../../services/quoteEmailSender.service.js";
import { renderHtmlToPdf } from "../../services/quotePdfGenerator.service.js";
import { buildQuoteEmailHtml, buildQuotePdfHtml } from "../../services/quotePdfTemplate.service.js";
import { fetchFullQuote } from "../../services/quoteRepository.service.js";
import { quotePricingService } from "../../services/quotePricing.service.js";
import {
  insertProductFulfillmentRecord,
  resolveProductFulfillmentTarget,
} from "../../services/productFulfillmentRegistry.service.js";
import { logger } from "../../utils/logger.js";
import { isServiceOrPolicy } from "../../utils/policyStatus.js";
import { resolveQuoteFolio } from "./infrastructure/quoteFolio.js";

const QUOTE_VALIDITY_DAYS = 15;

async function getQuoteItemsWithProduct(quoteId, queryRunner) {
  const [rows] = await queryRunner.query(
    `SELECT qi.id, qi.product_id, qi.quantity,
            p.name AS product_name, p.category AS product_category,
            p.product_type, p.folio AS product_folio
     FROM quote_items qi
     JOIN products p ON qi.product_id = p.id
     WHERE qi.quote_id = ?`,
    [quoteId],
  );
  return rows;
}

async function registerQuoteWithConnection(id, quote, connection) {
  if (quote.is_registered) {
    return quote;
  }

  const affected = await registerQuote(id, connection);
  if (!affected) {
    throw new Error("No se pudo registrar la cotización");
  }

  if (quote.contact_id) {
    const items = await getQuoteItemsWithProduct(id, connection);
    const serviceItems = items.filter((item) => isServiceOrPolicy(item));

    if (serviceItems.length > 0) {
      const startDate = new Date(quote.created_at);
      const expirationDate = new Date(
        startDate.getTime() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
      );
      const startDateStr = startDate.toISOString().split("T")[0];
      const expirationDateStr = expirationDate.toISOString().split("T")[0];

      for (const item of serviceItems) {
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
          const contactProductId = await insertContactProduct(
            {
              client_id: quote.client_id,
              contact_id: quote.contact_id,
              product_id: item.product_id,
              license_key: null,
              start_date: startDateStr,
              expiration_date: expirationDateStr,
              status: "ACTIVE",
            },
            connection,
          );

          const target = resolveProductFulfillmentTarget(item);
          if (target) {
            await insertProductFulfillmentRecord(connection, target, {
              contact_product_id: contactProductId,
              client_id: quote.client_id,
              contact_id: quote.contact_id,
              product_id: item.product_id,
              folio: quote.folio,
              start_date: startDateStr,
              expiration_date: expirationDateStr,
              status: "ACTIVE",
            });
          }
        }
      }
    }
  }

  return findQuoteById(id, connection);
}

export async function registerQuoteAction(id) {
  const quote = await findQuoteById(id);
  if (!quote) throw new Error("Cotización no encontrada");
  if (quote.is_registered) return quote;

  const connection = await getConnection();
  let txStarted = false;

  try {
    await connection.beginTransaction();
    txStarted = true;

    await registerQuoteWithConnection(id, quote, connection);

    await connection.commit();
    return await findQuoteById(id);
  } catch (error) {
    if (txStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePortalQuoteAction(id, user) {
  const connection = await getConnection();
  try {
    const quote = await findPortalQuote({
      quoteId: id,
      contactId: user.contactId,
      queryRunner: connection,
    });

    if (!quote) {
      throw new Error("Cotización no encontrada o no tienes permisos para eliminarla");
    }

    const affected = await softDeletePortalQuote({ quoteId: id, queryRunner: connection });
    return affected > 0;
  } finally {
    connection.release();
  }
}

export async function acceptPortalQuoteAction(id, user) {
  const connection = await getConnection();
  try {
    const quote = await findPortalQuote({
      quoteId: id,
      contactId: user.contactId,
      queryRunner: connection,
    });

    if (!quote) {
      throw new Error("Cotización no encontrada o no tienes permisos para aceptarla");
    }

    if (quote.status !== "ENVIADA") {
      throw new Error("Solo puedes aceptar cotizaciones enviadas");
    }

    const affected = await updatePortalQuoteResponseStatus(
      { quoteId: id, status: "ACEPTADA", expectedStatuses: ["ENVIADA"] },
      connection,
    );

    if (affected === 0) {
      throw new Error("La cotización ya fue respondida");
    }

    return affected > 0;
  } finally {
    connection.release();
  }
}

export async function rejectPortalQuoteAction(id, user) {
  const connection = await getConnection();
  try {
    const quote = await findPortalQuote({
      quoteId: id,
      contactId: user.contactId,
      queryRunner: connection,
    });

    if (!quote) {
      throw new Error("Cotización no encontrada o no tienes permisos para rechazarla");
    }

    if (quote.status !== "ENVIADA") {
      throw new Error("Solo puedes rechazar cotizaciones enviadas");
    }

    const affected = await updatePortalQuoteResponseStatus(
      { quoteId: id, status: "RECHAZADA", expectedStatuses: ["ENVIADA"] },
      connection,
    );

    if (affected === 0) {
      throw new Error("La cotización ya fue respondida");
    }

    return affected > 0;
  } finally {
    connection.release();
  }
}

export async function rejectQuoteAction(id) {
  const connection = await getConnection();
  try {
    const quote = await findQuoteById(id, connection);

    if (!quote || quote.is_deleted_admin) {
      throw new Error("Cotización no encontrada");
    }

    if (quote.status !== "SOLICITADA" && quote.status !== "PENDIENTE") {
      throw new Error("Solo se pueden rechazar solicitudes de cotización");
    }

    const affected = await updateQuoteStatus(
      { quoteId: id, status: "RECHAZADA" },
      connection,
    );

    return affected > 0;
  } finally {
    connection.release();
  }
}

export async function deleteQuoteAction(id) {
  const targetId = typeof id === "object" ? id?.id : id;
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const affected = await deleteQuote({
      quoteId: targetId,
      queryRunner: connection,
    });
    await connection.commit();
    return affected > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getQuoteAction(id) {
  const targetId = typeof id === "object" ? id?.id : id;
  return findQuoteById(targetId);
}

export async function getQuoteItemsAction(quoteId) {
  const targetId = typeof quoteId === "object" ? quoteId?.quoteId || quoteId?.id : quoteId;
  return findQuoteItemsByQuoteId(targetId);
}

export async function listQuotesAction(filters) {
  return listAllNonRequestedQuotes(filters);
}

export async function listQuotesByClientAction(clientId) {
  return listQuotesByClientId(clientId);
}

export async function listQuotesByUserAction(userId) {
  return listQuotesByUserId(userId);
}

export async function listPortalQuotesAction(contactId) {
  return listPortalQuotesByContact(contactId);
}

export async function getPendingQuoteRequestsCountAction() {
  return countPendingQuoteRequests();
}

export async function getUnreadQuoteRequestsAction() {
  return findUnreadQuoteRequests();
}

export async function markQuoteNotificationReadAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  const affected = await markQuoteNotificationAsRead(id);
  return affected > 0;
}

export async function dismissQuoteNotificationAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  const affected = await dismissQuoteNotification(id);
  return affected > 0;
}

export async function dismissAllQuoteNotificationsAction() {
  const affected = await dismissAllQuoteNotifications();
  return affected > 0;
}

export async function toggleQuotePortalAction(id, access, contact_id) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const quote = await findQuoteById(id, connection);
    if (!quote) throw new Error("Cotización no encontrada");

    if (access && !quote.is_registered) {
      await registerQuoteWithConnection(id, quote, connection);
    }

    const affected = await updateQuotePortalStatus(
      {
        quoteId: id,
        isSentToClientPortal: access ? 1 : 0,
        contactId: contact_id,
      },
      connection,
    );

    await connection.commit();
    return affected > 0;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function requestQuoteAction(input, user) {
  const { items } = input;
  const client_id = user.clientId;
  const contact_id = user.contactId;

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const productIds = items.map((item) => item.product_id);
    const products = await fetchProductsForQuote(productIds, connection);
    const pricing = quotePricingService.calculate({
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        discount: 0,
      })),
      products,
    });
    const folio = await resolveQuoteFolio({ queryRunner: connection });

    const quoteId = await createQuote({
      folio,
      client_id,
      contact_id,
      total: pricing.total,
      notes: "Solicitud de cotización desde Portal de Contacto",
      status: "SOLICITADA",
      is_contact_requested: 1,
      is_registered: 1,
      is_sent_to_client_portal: 1,
    }, connection);

    await insertQuoteItems(connection, { quoteId, items: pricing.items });

    await connection.commit();

    return {
      id: quoteId,
      folio,
      client_id,
      contact_id,
      user_id: null,
      total: pricing.total,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      status: "SOLICITADA",
      is_contact_requested: true,
      is_registered: true,
      notes: "Solicitud desde portal",
      created_at: new Date(),
      items: pricing.items,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function buildAutomaticContactEmailMessage(quote) {
  const folio = quote.folio || `#${quote.id}`;
  const total = Number(quote.total || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
  });

  return `Estimado ${quote.contact?.full_name || "cliente"},

Adjunto encontrará la cotización ${folio} por un total de $${total}.

Quedo a su disposición para agendar y revisar cualquier ajuste que considere necesario.

Saludos,
${quote.user?.full_name || "Equipo de Ventas"}`;
}

async function sendResolvedQuoteToContact(quoteId, loadedQuote = null) {
  const quote = loadedQuote || (await fetchFullQuote(quoteId));
  const contactEmail = quote.contact?.email;

  if (!contactEmail) {
    logger.warn(`Quote ${quoteId} was resolved automatically but has no contact email.`);
    return null;
  }

  return sendQuoteEmailAction({
    quote_id: quoteId,
    contact_email: contactEmail,
    message: buildAutomaticContactEmailMessage(quote),
    prefetchedQuote: quote,
  });
}

export async function resolveQuoteRequestAction(requestId, input, user) {
  const { client_id, contact_id, items, notes, folio: inputFolio } = input;

  const connection = await getConnection();
  let pricing;

  try {
    await connection.beginTransaction();

    const existing = await findContactRequestedQuoteForUpdate(
      requestId,
      connection,
    );
    if (!existing) {
      throw new Error("Solicitud no válida o ya procesada");
    }

    const productIds = items.map((item) => item.product_id);
    const products = await fetchProductsForQuote(productIds, connection);
    pricing = quotePricingService.calculate({ items, products });
    const finalItems = pricing.items;

    const userId = user.id || user.userId;
    const folio = await resolveQuoteFolio({
      explicitFolio: inputFolio || existing.folio,
      queryRunner: connection,
      excludeQuoteId: requestId,
    });
    const resolved = await resolveQuoteRequest({
      quoteId: requestId,
      folio,
      client_id,
      contact_id: contact_id || null,
      user_id: userId,
      total: pricing.total,
      notes,
      queryRunner: connection,
    });
    if (resolved === 0) {
      throw new Error("Solicitud no válida o ya procesada");
    }

    await replaceQuoteItems(connection, {
      quoteId: requestId,
      items: finalItems,
    });

    const resolvedQuote = await findQuoteById(requestId, connection);
    await registerQuoteWithConnection(requestId, resolvedQuote, connection);

    await acceptResolvedQuoteRequest(requestId, connection);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const fullQuote = await fetchFullQuote(requestId);

  void sendResolvedQuoteToContact(requestId, fullQuote).catch((error) => {
    logger.error("Error sending automatic resolved quote email:", error);
  });

  return {
    ...fullQuote,
    status: "ENVIADA",
  };
}

export async function updatePortalQuoteRequestAction(quoteId, input, user) {
  const { items } = input;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const quote = await findPortalQuote({
      quoteId,
      contactId: user.contactId,
      queryRunner: connection,
    });

    if (!quote) {
      throw new Error("Cotización no encontrada o no tienes permisos para editarla");
    }
    if (quote.status !== "SOLICITADA" && quote.status !== "PENDIENTE") {
      throw new Error("Solo puedes editar cotizaciones pendientes o solicitadas");
    }

    const productIds = items.map((item) => item.product_id);
    const products = await fetchProductsForQuote(productIds, connection);
    const pricing = quotePricingService.calculate({
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        discount: 0,
      })),
      products,
    });
    const folio = await resolveQuoteFolio({
      explicitFolio: quote.folio,
      queryRunner: connection,
      excludeQuoteId: quoteId,
    });

    await replaceQuoteItems(connection, {
      quoteId,
      items: pricing.items,
    });

    await updateQuoteTotal({
      quoteId,
      total: pricing.total,
      folio,
      queryRunner: connection,
    });

    await connection.commit();

    return {
      id: quoteId,
      total: pricing.total,
      folio,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      status: quote.status,
      is_registered: Boolean(quote.is_registered),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const defaultPdfDeps = {
  fetchFullQuote,
  buildQuotePdfHtml,
  renderHtmlToPdf,
  logger,
};

export async function generateQuotePdfAction(input, dependencies = defaultPdfDeps) {
  const quote_id = typeof input === "object" ? input?.quote_id || input?.id : input;
  const {
    fetchFullQuote: fetchQuote,
    buildQuotePdfHtml: buildHtml,
    renderHtmlToPdf: renderPdf,
    logger: actionLogger,
  } = dependencies;

  const trackingId = `quote-pdf-${quote_id}-${Date.now()}`;
  const quote = await fetchQuote(quote_id);
  const pdfHtml = buildHtml(quote);
  const folio = quote.folio || `#${quote.id}`;
  const pdfBuffer = await renderPdf(pdfHtml, { folio });

  actionLogger.info(`[${trackingId}] PDF generated for quote ${folio} (${pdfBuffer.length} bytes)`);
  return Buffer.from(pdfBuffer).toString("base64");
}

const defaultEmailDeps = {
  fetchFullQuote,
  renderHtmlToPdf,
  buildQuotePdfHtml,
  buildQuoteEmailHtml,
  calculateQuotePricing,
  validateEmailDeliverability,
  sendQuoteEmailMessage,
  markQuoteEmailSent,
  logger,
};

export async function sendQuoteEmailAction({ quote_id, contact_email, message, prefetchedQuote }, dependencies = defaultEmailDeps) {
  const {
    fetchFullQuote: fetchQuote,
    renderHtmlToPdf: renderPdf,
    buildQuotePdfHtml: buildPdfHtml,
    buildQuoteEmailHtml: buildEmailHtml,
    calculateQuotePricing: calcPricing,
    validateEmailDeliverability: validateEmail,
    sendQuoteEmailMessage: sendEmail,
    markQuoteEmailSent: persistEmailSent,
    logger: actionLogger,
  } = dependencies;

  const trackingId = `quote-email-${quote_id}-${Date.now()}`;
  const startedAt = Date.now();

  const [quote, emailValidation] = await Promise.all([
    prefetchedQuote ? Promise.resolve(prefetchedQuote) : fetchQuote(quote_id),
    validateEmail(contact_email),
  ]);

  if (!emailValidation.valid) {
    actionLogger.warn(`[${trackingId}] Send blocked for ${contact_email}: ${emailValidation.reason}`);
    throw new Error(`No se pudo enviar el correo: ${emailValidation.reason}`);
  }

  const pdfHtml = buildPdfHtml(quote);
  const folio = quote.folio || `#${quote.id}`;
  const pdfBuffer = await renderPdf(pdfHtml, { folio });

  const preparationMs = Date.now() - startedAt;
  const pricingData = calcPricing({ items: quote.items || [] });
  const emailHtml = buildEmailHtml(quote, message, pricingData);
  const subject = `Cotización ${folio} - ${quote.client.business_name}`;
  const pdfFilename = `Cotizacion_${String(folio).replace(/[^a-zA-Z0-9-_]+/g, "_")}.pdf`;

  let emailSentAt = null;
  try {
    const affected = await persistEmailSent(quote_id);
    if (affected) emailSentAt = new Date().toISOString();
  } catch (err) {
    actionLogger.error(`[${trackingId}] Optimistic persist failed:`, err);
  }

  const deliveryPromise = (async () => {
    const deliveryStartedAt = Date.now();
    try {
      await sendEmail({
        to: contact_email,
        subject,
        textMessage: message,
        htmlBody: emailHtml,
        pdfBuffer,
        pdfFilename,
      });

      actionLogger.info(
        `[${trackingId}] Quote email delivered to ${contact_email} (prepare=${preparationMs}ms, smtp=${Date.now() - deliveryStartedAt}ms, total=${Date.now() - startedAt}ms)`,
      );
    } catch (error) {
      actionLogger.error(`[${trackingId}] Background email delivery failed:`, error);
    }
  })();

  deliveryPromise.catch(() => {});

  return {
    success: true,
    message: "Correo enviado correctamente.",
    email_sent_at: emailSentAt,
  };
}

export const VALID_ADMIN_QUOTE_STATUSES = new Set([
  "PENDIENTE",
  "ENVIADA",
  "ACEPTADA",
  "RECHAZADA",
  "CANCELADA",
]);

export function assertGenericQuoteStatusUpdateAllowed(quote) {
  if (!quote) {
    throw new Error("Cotización no encontrada");
  }
  if (quote.is_contact_requested) {
    throw new Error("Las cotizaciones solicitadas por el contacto no pueden cambiarse mediante actualización genérica.");
  }
}

export async function updateQuoteStatusAction(id, status) {
  const connection = await getConnection();
  let txStarted = false;

  try {
    await connection.beginTransaction();
    txStarted = true;

    const currentQuote = await findQuoteById(id, connection);
    assertGenericQuoteStatusUpdateAllowed(currentQuote);

    const affected = await updateQuoteStatus({ quoteId: id, status }, connection);
    if (!affected) {
      throw new Error("Cotización no encontrada");
    }

    await connection.commit();
    return await findQuoteById(id);
  } catch (error) {
    if (txStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}
