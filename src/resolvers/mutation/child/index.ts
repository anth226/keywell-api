import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from '../../../tools/auth';
import add from './add'
import behavior from './behavior'

export default {
  add: combineResolvers(
    isAuthenticated,
    add
  ),
  behavior
} as any
