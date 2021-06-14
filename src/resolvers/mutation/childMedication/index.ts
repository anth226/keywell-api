import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from '../../../tools/auth';
import add from './add'

export default {
  add: combineResolvers(
    isAuthenticated,
    add
  ),
} as any
