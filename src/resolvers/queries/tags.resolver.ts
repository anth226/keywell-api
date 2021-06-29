import {combineResolvers} from 'graphql-resolvers'
import type {ReqContext} from '../../context';
import {UserModel} from '../../db/models';
import {isAuthenticated} from '../../tools/auth';
import {QueryTagsArgs, Tag} from '../../types/schema.types'
import {tagsService} from '../../services';

async function tags(parent: null, args: QueryTagsArgs, ctx: ReqContext): Promise<Array<Tag>> {
  const {type, group} = args
  const user = await UserModel.findOne({_id: ctx.me.id})
  const tags = group
    ? await tagsService.findTagsInGroup(type, group, user)
    : await tagsService.findAllTags(type, user);
  return tags.map(t => ({
    group: t.group,
    name: t.name,
    type: t.type
  } as Tag));
}

export default combineResolvers(
  isAuthenticated,
  tags,
) as any
