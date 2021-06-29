import {ApolloServer} from 'apollo-server';
import {importSchema} from 'graphql-import'
import resolvers from './resolvers';
import mocks from './mocks';
import {environment} from './environment';
import {UserData, verifyJwt} from './tools/auth';
import {childMedicationLoader, childSleepScheduleLoader, diagnosisLoader, medicationLoader} from './loader';
import {ReqContext} from './context';
import {tagsLoader} from './loader/tags.loader';
import {tagLoader} from './loader/tag.loader';

const server = new ApolloServer({
  context: async (ctx: ReqContext) => {
    // validate authorization header
    const authorization = ctx.req?.headers?.authorization
    if (authorization && typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      const token = authorization.substr(7)
      try {
        const me: UserData = verifyJwt(token)
        ctx.me = me
      } catch (error) {
        // Invalid token or expired token. Should log here?
        console.error('Token is invalid or expired')
        console.info(`Token: ${authorization}`)
      }
    }
    ctx.diagnosesLoader = diagnosisLoader()
    ctx.childMedicationsLoader = childMedicationLoader()
    ctx.medicationLoader = medicationLoader()
    ctx.tagLoader = tagLoader()
    ctx.tagsLoader = tagsLoader()
    ctx.childSleepScheduleLoader = childSleepScheduleLoader()
    return ctx
  },
  resolvers,
  typeDefs: importSchema('graphql/schema.graphql'),
  introspection: environment.apollo.introspection,
  playground: environment.apollo.playground,
  mocks: environment.mock.enabled && mocks,
  mockEntireSchema: false
});

export default server;
