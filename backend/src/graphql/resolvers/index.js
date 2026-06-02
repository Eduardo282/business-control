import Query from "./query/index.js";
import Mutation from "./mutation/index.js";
import * as Types from "./types.js";

import { GraphQLScalarType, Kind, GraphQLError } from "graphql";

function safeParseDateOrThrow(value) {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new GraphQLError("Invalid DateTime value", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    return value;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new GraphQLError(`Invalid DateTime value: ${value}`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  return date;
}

const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "Date custom scalar type",
  serialize(value) {
    return safeParseDateOrThrow(value).toISOString();
  },
  parseValue(value) {
    return safeParseDateOrThrow(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return safeParseDateOrThrow(ast.value);
    }
    return null;
  },
});

export default { Query, Mutation, ...Types, DateTime };
