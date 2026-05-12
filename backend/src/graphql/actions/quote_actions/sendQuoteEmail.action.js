import { pool } from "../../../config/db.js";
import { verifyEmailWithZeroBounce } from "../../../utils/zerobounce.js";
import { sendEmail } from "../../../utils/email.js";
import puppeteer from "puppeteer";
import { ensureQuoteItemDiscountColumnsAction } from "./ensureQuoteItemDiscountColumns.action.js";

export const sendQuoteEmailAction = async ({
  quote_id,
  contact_email,
  message,
  pdf_base64,
}) => {
  // 1. Obtener datos completos de la cotización
  const connection = await pool.getConnection();
  let quote;
  try {
    const [rows] = await connection.query("SELECT * FROM quotes WHERE id = ?", [
      quote_id,
    ]);
    if (rows.length === 0) throw new Error("Cotización no encontrada");
    quote = rows[0];

    // Obtener cliente
    const [clientRows] = await connection.query(
      "SELECT * FROM clients WHERE id = ?",
      [quote.client_id],
    );
    quote.client = clientRows[0];

    // Obtener usuario (vendedor)
    if (quote.user_id) {
      const [userRows] = await connection.query(
        "SELECT * FROM users WHERE id = ?",
        [quote.user_id],
      );
      quote.user = userRows[0];
    }

    // Fallback si no hay usuario (ej. cotización solicitada desde portal)
    if (!quote.user) {
      quote.user = {
        full_name: "Ventas en Línea",
        email: "ventas@businesscontrol.com",
      };
    }

    // Obtener contacto asignado a la cotización
    if (quote.contact_id) {
      const [contactRows] = await connection.query(
        "SELECT * FROM client_contacts WHERE id = ?",
        [quote.contact_id],
      );
      quote.contact = contactRows[0] || null;
    } else {
      quote.contact = null;
    }

    // Obtener items con detalles del producto
    let supportsDiscountColumns = false;
    try {
      supportsDiscountColumns = await ensureQuoteItemDiscountColumnsAction();
    } catch (error) {
      console.warn(
        "No se pudieron asegurar columnas de descuento en quote_items:",
        error.message,
      );
    }

    const [itemRows] =
      supportsDiscountColumns ?
        await connection.query(
          `SELECT
             qi.*,
             COALESCE(qi.base_unit_price, qi.unit_price) as base_unit_price,
             COALESCE(qi.discount, 0) as discount,
             p.name as product_name,
             p.description as product_desc,
             p.category as product_category,
             p.users_count as product_users_count
           FROM quote_items qi
           JOIN products p ON qi.product_id = p.id
           WHERE qi.quote_id = ?`,
          [quote_id],
        )
      : await connection.query(
          `SELECT
             qi.*,
             qi.unit_price as base_unit_price,
             0 as discount,
             p.name as product_name,
             p.description as product_desc,
             p.category as product_category,
             p.users_count as product_users_count
           FROM quote_items qi
           JOIN products p ON qi.product_id = p.id
           WHERE qi.quote_id = ?`,
          [quote_id],
        );

    quote.items = itemRows;
  } finally {
    connection.release();
  }

  // 2. Validar correo

  const validation = await verifyEmailWithZeroBounce(contact_email);
  if (validation.status === "invalid" || validation.status === "do_not_mail") {
    throw new Error(
      `El correo ${contact_email} no es válido según ZeroBounce (Status: ${validation.status})`,
    );
  }

  let providedPdfBuffer = null;
  if (pdf_base64) {
    const normalized = String(pdf_base64)
      .trim()
      .replace(/^data:application\/pdf;base64,/i, "");

    try {
      providedPdfBuffer = Buffer.from(normalized, "base64");
    } catch {
      throw new Error("El PDF adjunto no tiene un formato base64 válido.");
    }

    if (!providedPdfBuffer?.length) {
      throw new Error("El PDF adjunto está vacío.");
    }
  }

  // 3. Generar HTML para PDF
  const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });
  const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

  const itemsHtml = quote.items
    .map((item) => {
      const quantity = Number(item.quantity) || 0;
      const baseUnitPrice =
        Number(item.base_unit_price || item.unit_price) || 0;
      const discount = Math.min(100, Math.max(0, Number(item.discount || 0)));
      const discountedUnitPrice = Number(item.unit_price) || 0;
      const lineTotal =
        Number(item.total || discountedUnitPrice * quantity) || 0;

      return `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 16px 16px 16px 0; vertical-align: top;">
        <div style="font-weight: bold; color: #1e293b; font-size: 16px;">${item.product_name}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px; line-height: 1.5;">
          ${item.product_desc || item.product_category || ""}
          ${
            item.product_users_count > 0 ?
              `<span style="display: inline-block; margin-left: 8px; font-size: 10px; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; border: 1px solid #e2e8f0; vertical-align: middle;">${item.product_users_count} Usuario(s)</span>`
            : ""
          }
        </div>
      </td>
      <td style="padding: 16px; text-align: center; color: #475569; vertical-align: top; font-family: monospace;">${quantity}</td>
      <td style="padding: 16px; text-align: right; color: #475569; vertical-align: top; font-family: monospace;">${currencyFormatter.format(
        baseUnitPrice,
      )}</td>
      <td style="padding: 16px; text-align: right; color: ${discount > 0 ? "#dc2626" : "#475569"}; vertical-align: top; font-family: monospace;">${discount.toLocaleString(
        "es-MX",
        {
          maximumFractionDigits: 2,
        },
      )}%</td>
      <td style="padding: 16px; text-align: right; color: #475569; vertical-align: top; font-family: monospace;">${currencyFormatter.format(
        discountedUnitPrice,
      )}</td>
      <td style="padding: 16px 0 16px 16px; text-align: right; font-weight: bold; color: #0f172a; vertical-align: top; font-family: monospace;">${currencyFormatter.format(
        lineTotal,
      )}</td>
    </tr>
  `;
    })
    .join("");

  const grossSubtotal = roundMoney(
    quote.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const baseUnitPrice =
        Number(item.base_unit_price || item.unit_price) || 0;
      return sum + baseUnitPrice * quantity;
    }, 0),
  );
  const subtotal = roundMoney(
    quote.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
  );
  const totalDiscountAmount = roundMoney(Math.max(0, grossSubtotal - subtotal));
  const iva = roundMoney(subtotal * 0.16);
  const total = roundMoney(subtotal + iva);

  const contactInfoHtml =
    quote.contact ?
      `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
         <div class="info-title" style="margin-bottom: 8px; border-bottom: none; padding-bottom: 0;">Contacto</div>
         <div class="info-detail" style="font-weight: 600; color: #0f172a;">${quote.contact.full_name || "Sin nombre"}</div>
         <div class="info-detail">${quote.contact.position_title || "Sin puesto"}</div>
         <div class="info-detail">${quote.contact.email || "Sin correo"}</div>
         <div class="info-detail">${quote.contact.phone || "Sin teléfono"}</div>
       </div>`
    : `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;" class="info-detail">Sin contacto asignado</div>`;

  const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; padding: 0; margin: 0; color: #334155; background: #fff; -webkit-print-color-adjust: exact; }
          .container { max-width: 100%; margin: 0 auto; background: #fff; }
          .header { display: flex; justify-content: space-between; gap: 32px; border-bottom: 1px solid #f1f5f9; padding: 48px; }
          .title { font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; margin: 0; }
          .header-meta { margin-top: 16px; font-size: 14px; color: #64748b; display: flex; flex-direction: column; gap: 4px; }
          .header-row { display: flex; gap: 8px; }
          .header-label { font-weight: 600; width: 64px; }
          .company-name { font-size: 24px; font-weight: bold; color: #0f172a; }
          .company-details { font-size: 14px; color: #64748b; margin-top: 8px; line-height: 1.6; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding: 48px; background-color: #f8fafc; }
          .info-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .info-name { font-size: 18px; font-weight: bold; color: #0f172a; }
          .info-detail { font-size: 14px; color: #475569; margin-top: 4px; }
          .info-mono { font-family: monospace; font-size: 12px; color: #64748b; margin-top: 4px; }

          .table-container { padding: 0 48px 32px 48px; min-height: 300px; }
          table { width: 100%; border-collapse: collapse; margin-top: 32px; font-size: 14px; }
          th { text-align: left; padding: 12px 12px 12px 0; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; color: #0f172a; border-bottom: 2px solid #0f172a; }
          th.center { text-align: center; padding: 12px; }
          th.right { text-align: right; padding: 12px; }
          th.last { padding-right: 0; }
          
          .totals { padding: 0 48px 32px 48px; display: flex; flex-direction: column; align-items: flex-end; }
          .totals-box { width: 50%; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          .total-row { display: flex; justify-content: space-between; font-size: 14px; color: #64748b; margin-bottom: 8px; }
          .total-mono { font-family: monospace; color: #0f172a; }
          .total-final { display: flex; justify-content: space-between; border-top: 1px solid #0f172a; padding-top: 12px; margin-top: 8px; align-items: flex-end; }
          .final-label { font-size: 18px; font-weight: bold; color: #0f172a; }
          .final-value { font-size: 20px; font-weight: bold; font-family: monospace; color: #0f172a; }

          .notes { padding: 0 48px 32px 48px; }
          .notes-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; }
          .notes-content { background: #f8fafc; padding: 16px; border-radius: 4px; font-size: 14px; color: #475569; font-style: italic; border: 1px solid #f1f5f9; }

          .footer { background-color: #0f172a; color: white; padding: 48px; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .footer-content { display: flex; justify-content: space-between; gap: 16px; }
          .footer-title { font-weight: bold; text-transform: uppercase; color: #34d399; margin-bottom: 4px; }
          .footer-text { color: #94a3b8; line-height: 1.6; }
          .footer-right { text-align: right; }
          .footer-bottom { border-top: 1px solid #1e293b; margin-top: 32px; padding-top: 32px; display: flex; justify-content: space-between; color: #475569; width: 100%; align-items: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1 class="title">COTIZACIÓN</h1>
              <div class="header-meta">
                <div class="header-row"><span class="header-label">Folio:</span> <span style="font-family: monospace; color: #0f172a;">${quote.folio || "#" + quote.id}</span></div>
                <div class="header-row"><span class="header-label">Fecha:</span> <span>${new Date(quote.created_at).toLocaleDateString()}</span></div>
                <div class="header-row"><span class="header-label">Vigencia:</span> <span>15 días naturales</span></div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="company-name">Business Control</div>
              <div class="company-details">
                Av. Vallarta #1234, Col. Americana<br>
                Guadalajara, Jalisco, CP 44100<br>
                ventas@businesscontrol.com
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-title">Cliente</div>
              <div class="info-name">${quote.client.business_name}</div>
              <div class="info-detail">${quote.client.address || "Domicilio no registrado"}</div>
              <div class="info-mono">RFC: ${quote.client.rfc || "XAXX010101000"}</div>
              ${contactInfoHtml}
            </div>
            <div style="text-align: right;">
               <div class="info-title">Ejecutivo de Ventas</div>
               <div class="info-name">${quote.user.full_name}</div>
               <div class="info-detail">${quote.user.email}</div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Descripción / Producto</th>
                  <th class="center">Cant</th>
                  <th class="right">Precio Lista</th>
                  <th class="right">Desc.</th>
                  <th class="right">Precio Unit.</th>
                  <th class="right last">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <div class="totals-box">
              <div class="total-row"><span>Subtotal bruto</span> <span class="total-mono">${currencyFormatter.format(
                grossSubtotal,
              )}</span></div>
              <div class="total-row"><span>Descuento</span> <span class="total-mono">-${currencyFormatter.format(
                totalDiscountAmount,
              )}</span></div>
              <div class="total-row"><span>Subtotal neto</span> <span class="total-mono">${currencyFormatter.format(
                subtotal,
              )}</span></div>
              <div class="total-row"><span>IVA (16%)</span> <span class="total-mono">${currencyFormatter.format(
                iva,
              )}</span></div>
              <div class="total-final"><span class="final-label">Total Neto</span> <span class="final-value">${currencyFormatter.format(
                total,
              )}</span></div>
            </div>
          </div>

          ${
            quote.notes ?
              `<div class="notes">
                 <div class="notes-title">Notas Adicionales</div>
                 <div class="notes-content">${quote.notes}</div>
               </div>`
            : ""
          }

          <div class="footer">
            <div class="footer-content">
                <div>
                  <div class="footer-title">Información de Pago</div>
                  <div class="footer-text">
                    Banco: BBVA Bancomer<br>
                    Cuenta: 0123456789<br>
                    CLABE: 012000001234567890<br>
                    Beneficiario: Business Control S.A. de C.V.
                  </div>
                </div>
                <div class="footer-right">
                  <div class="footer-text">
                      * Precios sujetos a cambio sin previo aviso.<br>
                      * Tiempo de entrega sujeto a disponibilidad.
                  </div>
                </div>
            </div>

            <div class="footer-bottom">
              <div>Generado por Business Control System</div>
              <div style="font-family: monospace;">Página 1/1</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // 4. Crear PDF con Puppeteer
  let pdfBuffer;
  if (providedPdfBuffer) {
    pdfBuffer = providedPdfBuffer;
  } else {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    } finally {
      if (browser) await browser.close();
    }
  }

  // 5. Enviar correo con archivo adjunto
  const subject = `Cotización ${quote.folio || "#" + quote.id} - ${quote.client.business_name}`;
  
  // Limpiamos o estructuramos el mensaje del frontend para que se integre bien en la plantilla
  const htmlMessage = message.replace(/\n/g, "<br>");

  const emailBodyHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 20px; text-align: center; border-bottom: 4px solid #34d399;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Business Control</h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Documento Comercial</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 40px 30px;">
        <div style="display: flex; align-items: center; margin-bottom: 25px;">
          <h2 style="color: #0f172a; font-size: 22px; margin: 0; font-weight: 700;">Detalle de Cotización</h2>
          <span style="margin-left: auto; background-color: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: monospace;">
            ${quote.folio || "#" + quote.id}
          </span>
        </div>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 30px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7;">
            ${htmlMessage}
          </p>
        </div>
        
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 15px;">
          <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>¡Archivo adjunto seguro!</strong><br>
            Se ha adjuntado la cotización formal en formato PDF para su evaluación y resguardo.
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #1e293b; font-weight: 700; margin: 0 0 5px 0; font-size: 14px;">Business Control S.A. de C.V.</p>
        <p style="color: #64748b; margin: 0 0 15px 0; font-size: 13px;">Av. Vallarta #1234, Col. Americana, Guadalajara, Jalisco, CP 44100</p>
        
        <p style="color: #94a3b8; margin: 0; font-size: 11px; line-height: 1.5; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
          Este documento confidencial es de uso exclusivo para las personas a las que va dirigido.<br>
          Si usted recibió este correo por error, por favor elimínelo.
        </p>
      </div>
    </div>
  `;

  await sendEmail(contact_email, subject, message, emailBodyHtml, [
    {
      filename: `Cotizacion_${String(quote.folio || quote.id).replace(/[^a-zA-Z0-9-_]+/g, "_")}.pdf`,
      content: pdfBuffer,
    },
  ]);

  return { success: true, message: "Correo y PDF enviados exitosamente" };
};
