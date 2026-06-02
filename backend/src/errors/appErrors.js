import { GraphQLError } from "graphql";

export function unauthenticated(message = "No autenticado") {
  return new GraphQLError(message, {
    extensions: { code: "UNAUTHENTICATED" },
  });
}

export function forbidden(message = "No autorizado") {
  return new GraphQLError(message, {
    extensions: { code: "FORBIDDEN" },
  });
}

export function badUserInput(message, details = {}) {
  return new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT", details },
  });
}

export function notFound(message = "Recurso no encontrado") {
  return new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}
