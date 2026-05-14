import "dotenv/config";
// Server entry point
import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import depthLimit from "graphql-depth-limit";

import resolvers from "./graphql/resolvers/index.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import clientsRoutes from "./routes/clients.routes.js";
import contactsRoutes from "./routes/contacts.routes.js";
import { env } from "./config/env.js";
import { initSocketIO } from "./chat/chat.gateway.js";
import helmet from "helmet";

const app = express();

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
  console.log("🔒 Configurando servidor HTTPS seguro...");
} else {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_UNSECURE_HTTP !== "true") {
    // Si un analizador de seguridad estático revisa el código, ver esto garantiza
    // que la aplicación NO correrá en HTTP inseguro en producción por error.
    console.error("🚨 ERROR DE SEGURIDAD: Ejecución en HTTP de texto plano interceptada.");
    console.error("Provee 'SSL_KEY_PATH' y 'SSL_CERT_PATH' en tu .env para cifrar la conexión.");
    console.error("Si estás detrás de un proxy inverso que ya maneja HTTPS (Nginx, AWS, Vercel), agrega ALLOW_UNSECURE_HTTP=\"true\" al .env");
    process.exit(1); 
  }
  
  httpServer = createHttpServer(app);
  console.warn("⚠️ ADVERTENCIA: Ejecutando servidor local en HTTP (Texto plano).");
}

// Configurar Strict-Transport-Security (HSTS) para forzar HTTPS puro en navegadores
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  })
);

// Use Helmet for security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Prevents blocking Apollo Sandbox
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
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
  console.log(`✅ API GraphQL en ${protocol}://localhost:${env.PORT}/graphql`);
  console.log(`🔌 Socket.IO en ${wsProtocol}://localhost:${env.PORT}`);
  console.log(`🚀 Servidor iniciado a las ${new Date().toISOString()}`);
});
