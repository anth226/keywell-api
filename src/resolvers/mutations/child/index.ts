import _ from 'lodash'
import {combineResolvers} from 'graphql-resolvers'
import {isAuthenticated} from '../../../tools/auth';
import add from './add.resolver'

export default {
  add: combineResolvers(
    isAuthenticated,
    add
  ),
} as any
