import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from '../../../../tools/auth';
import track from './track'
import trackReaction from './trackReaction';

export default {
  track: combineResolvers(isAuthenticated, track),
  trackReaction: combineResolvers(isAuthenticated, trackReaction),
} as any;
