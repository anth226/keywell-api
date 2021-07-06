import type {ReqContext} from '../../context'
import {ITag} from '../../db/interfaces/tag.interface';
import _ from 'lodash';

export default async function incidentsResolver(parent: { incidents: any[] }, args: null, ctx: ReqContext): Promise<ITag[]> {
  if (!parent || !parent.incidents || !parent.incidents.length) {
    return []
  }
  // add t.name check because mongoose instance [id, id], id is also an object
  if (parent.incidents.some(t => _.isObject(t) && !_.isNil((t as any).name))) {
    // prefilled tags, return them as is.
    return parent.incidents;
  }
  const key = parent.incidents.toString();
  const json = await ctx.tagsLoader.load(key)
  return JSON.parse(json) as ITag[];
}
