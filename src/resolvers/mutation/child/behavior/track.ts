import { UserInputError } from 'apollo-server';
import type { ResolversContext } from '../../../../context';
import { Children, BehaviorTag, BehaviorRecord } from '../../../../db/models';
import {
  ChildBehaviorMutationsTrackArgs,
  BehaviorRecordPayload,
} from '../../../../types/schema.types';
import { getTimeOfDay, compareIds } from '../../../../utils';


export default async function (
  parent: null,
  args: ChildBehaviorMutationsTrackArgs,
  ctx: ResolversContext
): Promise<BehaviorRecordPayload> {
  const { childId, behavior } = args;
  const { me } = ctx;

  const child = await Children.findById(childId);
  if (!child || !compareIds(child.user_id, me.id)) {
    throw new UserInputError('BAD_USER_INPUT');
  }


  const behaviorTags = await BehaviorTag.find({
    name: { $in: behavior.tags },
    user_id: me.id,
    enabled: true,
  }).sort('order');

  if (behaviorTags.length === 0 || behaviorTags.length !== behavior.tags.length) {
    throw new UserInputError('Invalid or disabled behavior tags');
  }

  const newBehaviorRecord = await BehaviorRecord.create({
    tracked: behavior.info && behavior.info.date ? new Date(behavior.info.date): new Date(),
    time: behavior.info && behavior.info.time ? behavior.info.time : getTimeOfDay(),
    tags: behaviorTags,
    reaction: null,
  });

  const behaviorRecord: BehaviorRecordPayload = {
    id: childId,
    behavior: newBehaviorRecord,
  };

  return behaviorRecord;
}
