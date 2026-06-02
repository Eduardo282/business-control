import nodemailer from "nodemailer";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

/** @type {import('nodemailer').Transporter | null} */
let _transporter = null;

/**
 * Lazy-initialized singleton SMTP transporter.
 * Reuses a single TCP connection pool per process.
 */
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || "smtp.gmail.com",
      port: env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return _transporter;
}

export const sendEmail = async (to, subject, text, html, attachments = []) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.info(`Envío de correo simulado (sin credenciales SMTP) a: ${to}, subject: ${subject}, attachmentsCount: ${attachments.length}`);
    return { messageId: "mock-id", response: "Correo electrónico registrado en la consola" };
  }

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: `"Business Control" <${env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });

  logger.info(`Mensaje enviado: ${info.messageId}`);
  return info;
};
