import {GraphQLScalarType, Kind} from 'graphql';
import dayjs from 'dayjs';

// Date is always a string, don't convert it to JS Date

export const dateScalar = new GraphQLScalarType({
  name: 'Date',
  serialize(value) {
    return dayjs(value).format('YYYY-MM-DD')
  },
  parseValue(value) {
    return dayjs(value, 'YYYY-MM-DD').format('YYYY-MM-DD')
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return dayjs(parseInt(ast.value, 10)).format('YYYY-MM-DD'); // Convert hard-coded AST string to integer and then to Date
    }
    if (ast.kind === Kind.STRING) {
      return dayjs(ast.value).format('YYYY-MM-DD');
    }
    return null;
  },
});
