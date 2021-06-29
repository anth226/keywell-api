import {combineResolvers} from 'graphql-resolvers'
import {isAuthenticated} from '../../../../tools/auth';
import enableReminderResolver from './enableReminder.resolver';
import add from './add.resolver'

export default {
  add: combineResolvers(
    isAuthenticated,
    add
  ),
  enableReminder: combineResolvers(
    isAuthenticated,
    enableReminderResolver,
  )
} as any
