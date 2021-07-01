import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {
  BehaviorRecordPayload,
  ChildBehaviorMutationsEditArgs,
  ParentReaction,
  Tag,
  TagTypeEnum,
} from '../../../../types/schema.types';
import {compareIds} from '../../../../utils';
import {BehaviorModel, ChildModel, UserModel} from '../../../../db/models';
import {tagsService} from '../../../../services';

export default async function (
  parent: null,
  args: ChildBehaviorMutationsEditArgs,
  ctx: ResolversContext
): Promise<BehaviorRecordPayload> {
  const {id, behavior} = args;
  const {me} = ctx;

  if (!behavior.tags || !behavior.tags.length) {
    throw new UserInputError('At least one tag is expected');
  }

  const behaviorRecord = await BehaviorModel.findById(id)
    .select('+child');

  if (!behaviorRecord) {
    throw new UserInputError('Wrong record id');
  }

  const child = await ChildModel.findById(behaviorRecord.child);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Wrong record id');
  }

  const user = await UserModel.findOne({_id: ctx.me.id});
  const behaviorTags = await tagsService.findTags(TagTypeEnum.Behavior, behavior.tags, user);
  const record = await BehaviorModel.findByIdAndUpdate(id, {
      date: behavior.info && behavior.info.date,
      time: behavior.info && behavior.info.time,
      notes: behavior.info && behavior.info.notes,
      tags: behaviorTags
    },
    {
      new: true,
      omitUndefined: true
    }
  );

  return {
    id: id,
    behavior: {
      id: record.id,
      tracked: record.tracked.toISOString(),
      date: record.date,
      time: record.time,
      notes: record.notes ?? null,
      tags: behaviorTags.map(t => ({
        group: t.group,
        name: t.name,
        type: t.type,
      } as Tag)),
      reaction: record.reaction ? {
        tags: record.reaction.tags,
        feeling: record.reaction.feeling
      } as ParentReaction : null
    }
  } as BehaviorRecordPayload;
}
