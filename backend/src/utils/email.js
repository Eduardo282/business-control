import nodemailer from "nodemailer";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

export const sendEmail = async (to, subject, text, html, attachments = []) => {
  // Configurado a través de variables de entorno
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.gmail.com",
    port: env.SMTP_PORT || 465,
    secure: true, // true para 465, false para otros puertos
    auth: {
      user: env.SMTP_USER, // Tu correo electrónico
      pass: env.SMTP_PASS, // Tu contraseña o contraseña de aplicación
    },
  });

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.info(`Envío de correo simulado (sin credenciales SMTP) a: ${to}, subject: ${subject}, attachmentsCount: ${attachments.length}`);
    return { messageId: "mock-id", response: "Correo electrónico registrado en la consola" };
  }

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
