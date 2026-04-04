import "dotenv/config";
// Server entry point
import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import resolvers from "./graphql/resolvers/index.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import clientsRoutes from "./routes/clients.routes.js";
import contactsRoutes from "./routes/contacts.routes.js";
import { env } from "./config/env.js";

const app = express();

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
});

await server.start();

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => ({ user: req.user }),
  }),
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(env.PORT, () => {
  console.log(`✅ API GraphQL en http://localhost:${env.PORT}/graphql`);
  console.log(`🚀 Servidor iniciado a las ${new Date().toISOString()}`);
});
