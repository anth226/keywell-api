import { combineResolvers } from 'graphql-resolvers'
import type { ResolversContext } from '../../context';
import { isAuthenticated } from '../../tools/auth';
import { BehaviorTag } from '../../db/models'
import { BehaviorTag as BehaviorTagType, QueryBehaviorTagsArgs } from '../../types/schema.types'

async function behaviorTags(parent: null, args: QueryBehaviorTagsArgs, ctx: ResolversContext): Promise<Array<BehaviorTagType>> {
  const { group } = args
  const { me } = ctx
  const filter = {
    enabled: true,
    user_id: me.id,
    group: group
  }
  if (!group) delete filter.group
  return BehaviorTag.find(filter).sort({ order: 1 })
}

export default combineResolvers(
  isAuthenticated,
  behaviorTags
) as any