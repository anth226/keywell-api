import { template } from 'lodash';
import type { ResolversContext } from '../../../../context';
import { Children, BehaviorTag, BehaviorRecord } from '../../../../db/models';
import {
  ChildBehaviorMutationsTrackArgs,
  BehaviorRecordPayload,
} from '../../../../types/schema.types';

export default async function (
  parent: null,
  args: ChildBehaviorMutationsTrackArgs,
  context: ResolversContext
): Promise<BehaviorRecordPayload> {
  const { childId, behavior } = args;

  const child = await Children.findById(childId);
  const behaviorTags = await BehaviorTag.find({ name: { $in: behavior.tags } });

  const newBehaviorRecord = await BehaviorRecord.create({
    tracked: behavior.info?.date,
    time: behavior.info?.time,
    tags: behaviorTags,
    reaction: null,
  });

  const behaviorRecord: BehaviorRecordPayload = {
    id: newBehaviorRecord.id,
    behavior: newBehaviorRecord, 
  };

  return behaviorRecord; 
}
