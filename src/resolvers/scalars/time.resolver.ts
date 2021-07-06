import {GraphQLScalarType, Kind} from 'graphql';
import {TimeRegexp} from '../../utils';

export const timeScalar = new GraphQLScalarType({
  name: 'Time',
  description: 'Time scalar format HH:mm',
  serialize(value) {
    if (!TimeRegexp.test(value)) {
      console.error('Time format is invalid serialization');
      return '00:00'
    } 

    return value;
  },
  parseValue(value) {
    if (!TimeRegexp.test(value)) {
      throw new Error('Time format is invalid parsing');
    } 

    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (!TimeRegexp.test(ast.value)) {
        throw new Error('Time format is invalid parsing literal');
      } 
      return ast.value
    } else {
      throw new Error('Time type must be string');
    }
  },
});
