import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {
  SleepRecord,
  SleepRecordPayload,
  ChildSleepMutationsEditRecordArgs,
  Tag,
  TagTypeEnum,
} from '../../../../types/schema.types';
import {SleepModel, UserModel, ChildModel} from '../../../../db/models';
import {tagsService} from '../../../../services';
import {compareIds} from '../../../../utils';

export default async function (
  parent: null,
  args: ChildSleepMutationsEditRecordArgs,
  ctx: ResolversContext
): Promise<SleepRecordPayload> {
  const {id, sleep} = args;
  const {me} = ctx;

  if (!sleep.bedTime || !sleep.wakeUpTime) {
    throw new UserInputError('BedTime and WakeUpTime are required');
  }

  const sleepRecord = await SleepModel.findById(id)
  if (!sleepRecord) {
    throw new UserInputError('Wrong record id');
  }
  const child = await ChildModel.findById(sleepRecord.child);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Wrong record id');
  }

  const user = await UserModel.findOne({_id: me.id})
  const incidents = await tagsService.findTags(TagTypeEnum.Sleep, sleep.incidents, user)
  const record = await SleepModel.findByIdAndUpdate(id, {
    date: sleep.date,
    bedTime: sleep.bedTime,
    wakeUpTime: sleep.wakeUpTime,
    notes: sleep.notes,
    incidents
  },
    {
      new: true,
      omitUndefined: true
    }
  );

  return {
    id: record.id,
    sleep: {
      id: record.id,
      tracked: record.tracked.toISOString(),
      date: record.date,
      time: record.time,
      bedTime: record.bedTime,
      wakeUpTime: record.wakeUpTime,
      notes: record.notes ?? null,
      incidents: incidents.map(t => ({
        group: t.group,
        name: t.name,
        type: t.type,
      } as Tag)),
    } as SleepRecord
  } as SleepRecordPayload;
}
