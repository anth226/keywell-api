import {combineResolvers} from 'graphql-resolvers'
import {isAuthenticated} from '../../../tools/auth';
import add from './add.resolver'
import deleteRecord from './delete_record.resolver'

export default {
  add: combineResolvers(
    isAuthenticated,
    add
  ),
  deleteRecord: combineResolvers(
    isAuthenticated,
    deleteRecord
  ),
} as any
