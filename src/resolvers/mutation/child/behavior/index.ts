import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from '../../../../tools/auth';
import track from './track'
import trackReaction from './trackReaction';
import edit from './edit';

export default {
  edit: combineResolvers(isAuthenticated, edit),
  track: combineResolvers(isAuthenticated, track),
  trackReaction: combineResolvers(isAuthenticated, trackReaction),
} as any;
