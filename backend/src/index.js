import "dotenv/config";
// Server entry point (Updated schema)
import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import depthLimit from "graphql-depth-limit";

import resolvers from "./graphql/resolvers/index.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import clientsRoutes from "./routes/clients.routes.js";
import contactsRoutes from "./routes/contacts.routes.js";
import { env, validateEnv } from "./config/env.js";
import { initSocketIO } from "./chat/chat.gateway.js";
import helmet from "helmet";
import { logger } from "./utils/logger.js";
import { runMigrations } from "./migrations/runMigrations.js";

const app = express();
validateEnv();

if (process.env.RUN_MIGRATIONS === "true") {
  await runMigrations();
}

// Opciones de certificados SSL
const sslKeyPath = process.env.SSL_KEY_PATH || "";
const sslCertPath = process.env.SSL_CERT_PATH || "";
const useHttps = existsSync(sslKeyPath) && existsSync(sslCertPath);

// Create HTTP o HTTPS server for both Express and Socket.IO
let httpServer;
if (useHttps) {
  const httpsOptions = {
    key: readFileSync(sslKeyPath, "utf8"),
    cert: readFileSync(sslCertPath, "utf8"),
  };
  httpServer = createHttpsServer(httpsOptions, app);
  logger.info("Configurando servidor HTTPS seguro...");
} else {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_UNSECURE_HTTP !== "true") {
    // Si un analizador de seguridad estático revisa el código, ver esto garantiza
    // que la aplicación NO correrá en HTTP inseguro en producción por error.
    logger.error("ERROR DE SEGURIDAD: Ejecucion en HTTP de texto plano interceptada.");
    logger.error("Provee 'SSL_KEY_PATH' y 'SSL_CERT_PATH' en tu .env para cifrar la conexion.");
    logger.error("Si estas detras de un proxy inverso que ya maneja HTTPS (Nginx, AWS, Vercel), agrega ALLOW_UNSECURE_HTTP=\"true\" al .env");
    process.exit(1); 
  }
  
  httpServer = createHttpServer(app);
  logger.warn("ADVERTENCIA: Ejecutando servidor local en HTTP (texto plano).");
}

// Configurar Strict-Transport-Security (HSTS) para forzar HTTPS puro en navegadores
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

// Interceptar y blindar cualquier Cookie generada (como las de Socket.io o proxy) mitigando "Cookie sin Flag" de ZAP
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

// Use Helmet for security headers (Reparando Anti-Clickjacking y CSP)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, 
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    frameguard: { action: "deny" }, // Evita el enmarcado de iFrames por terceros (Clickjacking)
    hidePoweredBy: true, // Oculta tecnología trasera (Express)
    noSniff: true, // X-Content-Type-Options
  })
);

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(authMiddleware);
app.use("/api/clients", clientsRoutes);
app.use("/api/contacts", contactsRoutes);

const typeDefs = readFileSync(
  join(process.cwd(), "src/graphql/schema.graphql"),
  "utf8",
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production", // Deshabilita la introspección en producción por seguridad
  validationRules: [depthLimit(10)], // Previene ataques DoS limitando la profundidad de anidación
});

await server.start();

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => ({ user: req.user }),
  }),
);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Initialize Socket.IO for real-time support chat
initSocketIO(httpServer, env.CORS_ORIGIN);

httpServer.listen(env.PORT, () => {
  const protocol = useHttps ? "https" : "http";
  const wsProtocol = useHttps ? "wss" : "ws";
  logger.info(`API GraphQL en ${protocol}://localhost:${env.PORT}/graphql`);
  logger.info(`Socket.IO en ${wsProtocol}://localhost:${env.PORT}`);
  logger.info(`Servidor iniciado a las ${new Date().toISOString()}`);
});
