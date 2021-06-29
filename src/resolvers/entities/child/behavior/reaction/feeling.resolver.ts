import type {ReqContext} from '../../../../../context'
import {ITag} from '../../../../../db/interfaces/tag.interface';
import _ from 'lodash';

export default async function feelingResolver(parent: { feeling: string }, args: null, ctx: ReqContext): Promise<ITag> {
  if (!parent || !parent.feeling) {
    return null
  }
  if (_.isObject(parent.feeling)) {
    // pre-filled
    return parent.feeling
  }
  return await ctx.tagLoader.load(parent.feeling)
}
