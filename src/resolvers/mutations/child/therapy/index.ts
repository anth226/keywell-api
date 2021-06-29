import {combineResolvers} from 'graphql-resolvers';
import {isAuthenticated} from '../../../../tools/auth';
import track from './track.resolver';

export default {
  track: combineResolvers(
    isAuthenticated,
    track
  )
} as any
