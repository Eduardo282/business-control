import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import clientsRoutes from "../routes/clients.routes.js";
import contactsRoutes from "../routes/contacts.routes.js";

export function createApp({ corsOrigin }) {
  const app = express();

  // Strict-Transport-Security (HSTS) para forzar HTTPS puro en navegadores
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    })
  );

  // Control estricto de Caché para mitigar "Directivas de Control de Caché" de ZAP
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Interceptar y blindar cualquier Cookie generada mitigando "Cookie sin Flag" de ZAP
  app.use((req, res, next) => {
    const originalCookie = res.cookie;
    res.cookie = function (name, value, options) {
      const secureOptions = {
        ...options,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      };
      return originalCookie.call(res, name, value, secureOptions);
    };
    next();
  });

  // Helmet security headers (Anti-Clickjacking y CSP)
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      noSniff: true,
    })
  );

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: "50mb" }));
  app.use(authMiddleware);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/contacts", contactsRoutes);
  app.get("/health", (_req, res) => res.json({ ok: true }));

  return app;
}
