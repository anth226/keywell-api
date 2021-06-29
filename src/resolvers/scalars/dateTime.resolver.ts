import {GraphQLScalarType, Kind} from 'graphql';
import dayjs from 'dayjs';

export const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize(value) {
    return dayjs(value.toString()).toISOString(); // Convert outgoing Date to integer for JSON
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});
