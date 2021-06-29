import type {ReqContext} from '../../context'
import {ITag} from '../../db/interfaces/tag.interface';
import _ from 'lodash';

export default async function tagsResolver(parent: { tags: any[] }, args: null, ctx: ReqContext): Promise<ITag[]> {
  if (!parent || !parent.tags || !parent.tags.length) {
    return []
  }
  if (parent.tags.some(t => _.isObject(t))) {
    // prefilled tags, return them as is.
    return parent.tags;
  }
  let key = parent.tags.toString();
  let json = await ctx.tagsLoader.load(key)
  return JSON.parse(json) as ITag[];
}
