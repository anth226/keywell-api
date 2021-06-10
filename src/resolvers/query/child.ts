import _ from 'lodash'
import { combineResolvers } from 'graphql-resolvers'
import type { ResolversContext } from '../../context';
import { isAuthenticated } from '../../tools/auth';
import { Child, Diagnosis, QueryChildArgs } from '../../types/schema.types'
import { decrypt } from '../../tools/encryption';
import { Children } from '../../db/models';

async function child(parent: null, args: QueryChildArgs, ctx: ResolversContext): Promise<Child | null> {
  const { id } = args
  
  const child = await  Children.findOne({
    _id: id,
    user_id: ctx.me?.id
  })
  if (_.isNil(child)) {
    return null
  }
  
  const result: Child = {
    ...child.toObject(),
    id: child.id,
    name: await decrypt(child.get('name', Buffer)),
    diagnoses: child.diagnoses_id.map(id => ({
      id
    })) as Diagnosis[]
  }

  return result
}

export default combineResolvers(
  isAuthenticated,
  child,
) as any