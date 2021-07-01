import {combineResolvers} from 'graphql-resolvers';
import {isAuthenticated} from '../../../../tools/auth';
import track from './track.resolver';
import edit from './edit.resolver'

export default {
  track: combineResolvers(
    isAuthenticated,
    track
  ),
  edit: combineResolvers(
    isAuthenticated,
    edit
  ),
} as any
