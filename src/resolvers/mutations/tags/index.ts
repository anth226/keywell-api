import {combineResolvers} from 'graphql-resolvers';
import {isAuthenticated} from '../../../tools/auth';
import enableTag from './enableTag.resolver';
import disableTag from './disableTag.resolver';

export default {
  enable: combineResolvers(
    isAuthenticated,
    enableTag
  ),
  disable: combineResolvers(
    isAuthenticated,
    disableTag
  ),
} as any
