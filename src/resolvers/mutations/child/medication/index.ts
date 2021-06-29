import {combineResolvers} from 'graphql-resolvers'
import {isAuthenticated} from '../../../../tools/auth';
import add from './add.resolver'
import edit from './edit.resolver'
import enableReminder from './enableReminder.resolver';

export default {
  add: combineResolvers(
    isAuthenticated,
    add
  ),
  edit: combineResolvers(
    isAuthenticated,
    edit
  ),
  enableReminder: combineResolvers(
    isAuthenticated,
    enableReminder
  )
} as any
