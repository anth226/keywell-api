import _ from 'lodash'
import {combineResolvers} from 'graphql-resolvers'
import type {ResolversContext} from '../../context';
import {isAuthenticated} from '../../tools/auth';
import {Child, Diagnosis, QueryChildArgs} from '../../types/schema.types'
import {decrypt} from '../../tools/encryption';
import {ChildModel} from '../../db/models';
import {UserInputError} from 'apollo-server-errors';

async function child(parent: null, args: QueryChildArgs, ctx: ResolversContext): Promise<Child | null> {
  const {id} = args

  const child = await ChildModel.findOne({
    _id: id,
    user: ctx.me?.id
  })
  if (_.isNil(child)) {
    throw new UserInputError('Child cannot found')
  }

  return {
    id: child.id,
    name: await decrypt(child.get('name', Buffer)),
    age: child.age,
    diagnoses: child.diagnoses.map(id => ({
      id
    })) as Diagnosis[]
  }
}

export default combineResolvers(
  isAuthenticated,
  child,
) as any
