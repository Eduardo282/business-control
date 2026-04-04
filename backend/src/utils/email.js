import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html, attachments = []) => {
  // Configurado a través de variables de entorno
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER, // Tu correo electrónico
      pass: process.env.SMTP_PASS, // Tu contraseña o contraseña de aplicación
    },
  });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Envío de correo simulado (sin credenciales SMTP):", {
      to,
      subject,
      text,
      attachmentsCount: attachments.length,
    });
    return { messageId: "mock-id", response: "Correo electrónico registrado en la consola" };
  }

  const info = await transporter.sendMail({
    from: `"Business Control" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });

  console.log("Mensaje enviado: %s", info.messageId);
  return info;
};
