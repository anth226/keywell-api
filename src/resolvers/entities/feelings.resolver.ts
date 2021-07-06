import type {ReqContext} from '../../context'
import {ITag} from '../../db/interfaces';
import _ from 'lodash';

export default async function feelingsResolver(parent: { feelings: any[] }, args: null, ctx: ReqContext): Promise<ITag[]> {
  if (!parent || !parent.feelings || !parent.feelings.length) {
    return []
  }
  if (parent.feelings.some(t => _.isObject(t))) {
    // prefilled tags, return them as is.
    return parent.feelings;
  }
  let key = parent.feelings.toString();
  let json = await ctx.tagsLoader.load(key)
  return JSON.parse(json) as ITag[];
}
