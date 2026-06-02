import "dotenv/config";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync, existsSync } from "node:fs";
import { expressMiddleware } from "@as-integrations/express5";

import { createApp } from "./server/createApp.js";
import { createApolloGraphqlServer } from "./server/createApolloGraphqlServer.js";
import { env, validateEnv } from "./config/env.js";
import { initSocketIO } from "./chat/chat.gateway.js";
import { logger } from "./utils/logger.js";
import { runMigrations } from "./migrations/runMigrations.js";
import { createLoaders } from "./graphql/dataloaders/createLoaders.js";

validateEnv();

if (process.env.RUN_MIGRATIONS === "true") {
  await runMigrations();
}

// --- Express app ---
const app = createApp({ corsOrigin: env.CORS_ORIGIN });

// --- HTTPS / HTTP ---
const sslKeyPath = process.env.SSL_KEY_PATH || "";
const sslCertPath = process.env.SSL_CERT_PATH || "";
const useHttps = existsSync(sslKeyPath) && existsSync(sslCertPath);

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
    logger.error("ERROR DE SEGURIDAD: Ejecucion en HTTP de texto plano interceptada.");
    logger.error("Provee 'SSL_KEY_PATH' y 'SSL_CERT_PATH' en tu .env para cifrar la conexion.");
    logger.error('Si estas detras de un proxy inverso que ya maneja HTTPS (Nginx, AWS, Vercel), agrega ALLOW_UNSECURE_HTTP="true" al .env');
    process.exit(1);
  }

  httpServer = createHttpServer(app);
  logger.warn("ADVERTENCIA: Ejecutando servidor local en HTTP (texto plano).");
}

// --- Apollo GraphQL ---
const server = createApolloGraphqlServer();
await server.start();

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => ({ user: req.user, loaders: createLoaders() }),
  }),
);

// --- Socket.IO ---
initSocketIO(httpServer, env.CORS_ORIGIN);

// --- Start ---
httpServer.listen(env.PORT, () => {
  const protocol = useHttps ? "https" : "http";
  const wsProtocol = useHttps ? "wss" : "ws";
  logger.info(`API GraphQL en ${protocol}://localhost:${env.PORT}/graphql`);
  logger.info(`Socket.IO en ${wsProtocol}://localhost:${env.PORT}`);
  logger.info(`Servidor iniciado a las ${new Date().toISOString()}`);
});
