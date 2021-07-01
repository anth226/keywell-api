import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {
  TherapyRecord,
  TherapyRecordPayload,
  ChildTherapyMutationsEditArgs,
  Tag,
  TagTypeEnum,
} from '../../../../types/schema.types';
import {TherapyModel, UserModel, ChildModel} from '../../../../db/models';
import {tagsService} from '../../../../services';
import {compareIds} from '../../../../utils';

export default async function (
  parent: null,
  args: ChildTherapyMutationsEditArgs,
  ctx: ResolversContext
): Promise<TherapyRecordPayload> {
  const {id, therapy} = args;
  const {me} = ctx;

  if (!therapy.tags || !therapy.tags.length) {
    throw new UserInputError('At least one tag is expected');
  }

  const therapyRecord = await TherapyModel.findById(id)
  if (!therapyRecord) {
    throw new UserInputError('Wrong record id');
  }
  const child = await ChildModel.findById(therapyRecord.child);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Wrong record id');
  }

  const user = await UserModel.findOne({_id: me.id})
  const tags = await tagsService.findTags(TagTypeEnum.Therapy, therapy.tags, user)
  const record = await TherapyModel.findByIdAndUpdate(id, {
    date: therapy.info && therapy.info.date,
    time: therapy.info && therapy.info.time,
    notes: therapy.info && therapy.info.notes,
    tags
  },
    {
      new: true,
      omitUndefined: true
    }
  );

  return {
    id: id,
    therapy: {
      id: record.id,
      tracked: record.tracked.toISOString(),
      date: record.date,
      time: record.time,
      notes: record.notes ?? null,
      tags: tags.map(t => ({
        group: t.group,
        name: t.name,
        type: t.type,
      } as Tag)),
    } as TherapyRecord
  } as TherapyRecordPayload;
}
