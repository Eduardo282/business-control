import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";
import resolvers from "../graphql/resolvers/index.js";

export function createApolloGraphqlServer() {
  const typeDefs = readFileSync(
    join(process.cwd(), "src/graphql/schema.graphql"),
    "utf8",
  );

  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    validationRules: [depthLimit(10)],
  });
}
