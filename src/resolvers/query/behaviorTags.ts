import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated } from '../../tools/auth';
import type { ResolversContext } from '../../context';
import { BehaviorTag, BehaviorGroup } from '../../types/schema.types';
import { BehaviorTagModel } from '../../db/models';
import { map } from 'p-iteration';

interface behaviorTagsArgs {
  group: BehaviorGroup;
  userID?: string;
}

interface TagQuery {
  user_id: string;
  enabled: boolean;
  group?: BehaviorGroup;
}

async function behaviorTags(
  parent: null,
  args: behaviorTagsArgs,
  ctx: ResolversContext
): Promise<BehaviorTag[]> {
  const { group, userID } = args;

  const tagQuery = {
    user_id: userID ? userID : ctx.me?.id,
    enabled: true,
  } as TagQuery;

  if (group) {
    tagQuery.group = group;
  }

  const tags = await BehaviorTagModel.find(tagQuery).sort('order');
  const results = await map(tags, async (tag) => {
    const { id, name, group, order, user_id, enabled } = tag;
    return {
      id,
      name,
      group,
      order,
      user_id,
      enabled,
    };
  });
  return results as BehaviorTag[];
}

export default combineResolvers(isAuthenticated, behaviorTags) as any;
