import {ApolloServer} from 'apollo-server';
import { importSchema } from 'graphql-import'
import {getDB} from './tools/mongo';
import resolvers from './resolvers';
import mocks from './mocks';
import {environment} from './environment';
import { verifyJwt, UserData } from './tools/auth';
import { diagnosisLoader } from './loader';
import { ReqContext } from './context';

const server = new ApolloServer({
    context: async (ctx: ReqContext) => {
      ctx.db = await getDB()
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
