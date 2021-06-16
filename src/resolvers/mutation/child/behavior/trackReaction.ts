import { UserInputError } from 'apollo-server';
import type { ResolversContext } from '../../../../context';
import {
  BehaviorRecord,
  BehaviorTag,
  ParentReaction,
  Children,
} from '../../../../db/models';
import {
  ChildBehaviorMutationsTrackReactionArgs,
  ParentReactionPayload,
} from '../../../../types/schema.types';
import { IBehaviorRecordWithChildId } from '../../../types'

import { compareIds } from '../../../../utils';

export default async function (
  parent: null,
  args: ChildBehaviorMutationsTrackReactionArgs,
  ctx: ResolversContext
): Promise<ParentReactionPayload> {
  const {
    trackedBehaviorId,
    reaction: { tags, feeling },
  } = args;
  const { me } = ctx

  const behaviorRecord: IBehaviorRecordWithChildId =
    await BehaviorRecord.findById(trackedBehaviorId).select('+child_id');
  
  if (!behaviorRecord || !behaviorRecord.child_id) {
    throw new UserInputError('Invalid trackedBehaviorId does not exist in behaviorRecord');
  }

  const child = await Children.findById(behaviorRecord.child_id);
  if (!child || !compareIds(child.user_id, me.id)) {
    throw new UserInputError(
      'Invalid trackedBehaviorId does not have childID'
    );
  }

  const behaviorTags = await BehaviorTag.find({
    name: { $in: tags },
    enabled: true,
  }).sort('order');

  if (behaviorTags.length === 0 || behaviorTags.length !== tags.length) {
    throw new UserInputError('Invalid or disabled behavior tags');
  }

  const newBehaviorRecord = await ParentReaction.create({
    tags: behaviorTags.map(tag => tag.id),
    feeling,
    behavior_record_id: behaviorRecord.id,
  });

  const parentReaction: ParentReactionPayload = {
    id: newBehaviorRecord.id,
    reaction: newBehaviorRecord,
  };

  return parentReaction;
}
