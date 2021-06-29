import {combineResolvers} from 'graphql-resolvers'
import {isAuthenticated} from '../../../../tools/auth';
import track from './track.resolver'
import trackReaction from './trackReaction.resolver'
import edit from './edit.resolver'

export default {
  track: combineResolvers(
    isAuthenticated,
    track
  ),
  trackReaction: combineResolvers(
    isAuthenticated,
    trackReaction
  ),
  edit: combineResolvers(
    isAuthenticated,
    edit
  )
} as any
