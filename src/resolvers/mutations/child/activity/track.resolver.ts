import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {ActivityModel, ChildModel, UserModel} from '../../../../db/models';
import {
  ActivityRecord,
  ActivityRecordPayload,
  ChildActivityMutationsTrackArgs,
  Tag,
  TagTypeEnum
} from '../../../../types/schema.types';
import {compareIds, getCurrentDateFormatted, getTimeOfDay} from '../../../../utils';
import {tagsService} from '../../../../services';

export default async function (
  parent: null,
  args: ChildActivityMutationsTrackArgs,
  ctx: ResolversContext
): Promise<ActivityRecordPayload> {
  const {childId, activity} = args;
  const {me} = ctx;

  if (!activity.tags || !activity.tags.length) {
    throw new UserInputError('At least one tag is expected');
  }

  const child = await ChildModel.findById(childId);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Incorrect child id');
  }

  const user = await UserModel.findOne({_id: ctx.me.id})
  const tags = await tagsService.findTags(TagTypeEnum.Activity, activity.tags, user)
  const record = await ActivityModel.create({
    tracked: new Date(),
    date: activity.info && activity.info.date || getCurrentDateFormatted(),
    time: activity.info && activity.info.time || getTimeOfDay(),
    notes: activity.info && activity.info.notes,
    tags,
    child
  });

  return {
    id: record.id,
    activity: {
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
    } as ActivityRecord
  } as ActivityRecordPayload;
}
