import {combineResolvers} from 'graphql-resolvers'
import {isAuthenticated} from '../../../../tools/auth';
import enableReminderResolver from './enableReminder.resolver';
import add from './add.resolver'
import edit from './edit.resolver'

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
    enableReminderResolver,
  )
} as any
