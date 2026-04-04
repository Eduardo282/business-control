import Query from "./query/index.js";
import Mutation from "./mutation/index.js";
import * as Types from "./types.js";

import { GraphQLScalarType, Kind } from "graphql";

const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "Date custom scalar type",
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(value).toISOString();
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export default { Query, Mutation, ...Types, DateTime };
