import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";
import resolvers from "../graphql/resolvers/index.js";

const schemaPath = fileURLToPath(new URL("../graphql/schema.graphql", import.meta.url));

export function createApolloGraphqlServer() {
  const typeDefs = readFileSync(schemaPath, "utf8");

  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    validationRules: [depthLimit(10)],
  });
}
