import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from '../../../../tools/auth';
import add from './add.resolver'
import remove from './remove.resolver'

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
