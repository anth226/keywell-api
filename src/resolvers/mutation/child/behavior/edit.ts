import { UserInputError } from 'apollo-server';
import type { ResolversContext } from '../../../../context';
import { BehaviorTag, BehaviorRecord } from '../../../../db/models';
import {
  ChildBehaviorMutationsEditArgs,
  BehaviorRecordPayload,
} from '../../../../types/schema.types';
import { compareIds } from '../../../../utils';
import { IBehaviorRecordWithChildId } from '../../../types';
import { IChildren } from '../../../../db/models/types';
import dayjs from 'dayjs';

export default async function (
  parent: null,
  args: ChildBehaviorMutationsEditArgs,
  ctx: ResolversContext
): Promise<BehaviorRecordPayload> {
  const { id, behavior } = args;
  const { me } = ctx;

  // I'd like to suggest to use it as global. This way allows to make short code lines.
  const behaviorRecord: IBehaviorRecordWithChildId = await (
    await BehaviorRecord.findById(id).select('+child_id')
  )
    ?.populate('child_id')
    .execPopulate();
  if (
    !behaviorRecord ||
    !compareIds((behaviorRecord.child_id as IChildren).user_id, me.id)
  ) {
    throw new UserInputError('BAD_USER_INPUT');
  }

  const behaviorTags = await BehaviorTag.find({
    name: { $in: behavior.tags },
    user_id: me.id,
    enabled: true,
  }).sort('order');

  if (
    behaviorTags.length === 0 ||
    behaviorTags.length !== behavior.tags.length
  ) {
    throw new UserInputError('Invalid or disabled behavior tags');
  }

  const tracked =
    behavior.info && behavior.info.date
      ? dayjs(behavior.info.date)
      : dayjs(behaviorRecord.tracked);
  if (!tracked.isValid()) {
    throw new UserInputError('Invalid date format behavior:tracked field');
  }

  const updatedBehaviorRecord = await BehaviorRecord.findByIdAndUpdate(
    id,
    {
      tracked:
        behavior.info && behavior.info.date
          ? new Date(behavior.info.date)
          : new Date(behaviorRecord.tracked),
      time:
        behavior.info && behavior.info.time
          ? behavior.info.time
          : behaviorRecord.time,
      tags: behaviorTags,
      reaction: null,
      child_id: (behaviorRecord.child_id as IChildren).id,
    },
    { new: true }
  );

  const behaviorRecordPayload: BehaviorRecordPayload = {
    id,
    behavior: updatedBehaviorRecord,
  };

  return behaviorRecordPayload;
}
