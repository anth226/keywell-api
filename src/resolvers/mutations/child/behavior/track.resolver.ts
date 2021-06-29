import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {BehaviorModel, ChildModel, UserModel} from '../../../../db/models';
import {
  BehaviorRecord,
  BehaviorRecordPayload,
  ChildBehaviorMutationsTrackArgs,
  Tag,
  TagTypeEnum
} from '../../../../types/schema.types';
import {compareIds, getCurrentDateFormatted, getTimeOfDay} from '../../../../utils';
import {tagsService} from '../../../../services';

export default async function (
  parent: null,
  args: ChildBehaviorMutationsTrackArgs,
  ctx: ResolversContext
): Promise<BehaviorRecordPayload> {
  const {childId, behavior} = args;
  const {me} = ctx;

  if (!behavior.tags || !behavior.tags.length) {
    throw new UserInputError('At least one tag is expected');
  }

  const child = await ChildModel.findById(childId);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Incorrect child id');
  }

  const user = await UserModel.findOne({_id: ctx.me.id})
  const tags = await tagsService.findTags(TagTypeEnum.Behavior, behavior.tags, user)
  const record = await BehaviorModel.create({
    tracked: new Date(),
    date: behavior.info && behavior.info.date || getCurrentDateFormatted(),
    time: behavior.info && behavior.info.time || getTimeOfDay(),
    notes: behavior.info && behavior.info.notes,
    tags,
    child
  });

  return {
    id: record.id,
    behavior: {
      id: record.id,
      tracked: record.tracked.toISOString(),
      date: record.date,
      time: record.time,
      notes: record.notes ?? null,
      tags: record.tags.map(t => ({
        group: t.group,
        name: t.name,
        type: t.type,
      } as Tag)),
      reaction: null,
    } as BehaviorRecord
  } as BehaviorRecordPayload;
}
