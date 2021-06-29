import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {TherapyModel, ChildModel, UserModel} from '../../../../db/models';
import {
  TherapyRecord,
  TherapyRecordPayload,
  ChildTherapyMutationsTrackArgs,
  Tag,
  TagTypeEnum
} from '../../../../types/schema.types';
import {compareIds, getCurrentDateFormatted, getTimeOfDay} from '../../../../utils';
import {tagsService} from '../../../../services';

export default async function (
  parent: null,
  args: ChildTherapyMutationsTrackArgs,
  ctx: ResolversContext
): Promise<TherapyRecordPayload> {
  const {childId, therapy} = args;
  const {me} = ctx;

  if (!therapy.tags || !therapy.tags.length) {
    throw new UserInputError('At least one tag is expected');
  }

  const child = await ChildModel.findById(childId);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Incorrect child id');
  }

  const user = await UserModel.findOne({_id: ctx.me.id})
  const tags = await tagsService.findTags(TagTypeEnum.Therapy, therapy.tags, user)
  const record = await TherapyModel.create({
    tracked: new Date(),
    date: therapy.info && therapy.info.date || getCurrentDateFormatted(),
    time: therapy.info && therapy.info.time || getTimeOfDay(),
    notes: therapy.info && therapy.info.notes,
    tags,
    child
  });

  return {
    id: record.id,
    therapy: {
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
    } as TherapyRecord
  } as TherapyRecordPayload;
}
