import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from '../../../tools/auth';
import add from './add'
import remove from './remove'

export default {
  add: combineResolvers(
    isAuthenticated,
    add
  ),
  remove: combineResolvers(
    isAuthenticated,
    remove
  )
} as any
