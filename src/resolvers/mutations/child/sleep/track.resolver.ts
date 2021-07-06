import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {SleepModel, ChildModel, UserModel} from '../../../../db/models';
import {
  SleepRecord,
  SleepRecordPayload,
  ChildSleepMutationsTrackArgs,
  Tag,
  TagTypeEnum
} from '../../../../types/schema.types';
import {compareIds, getCurrentDateFormatted, getTimeOfDay} from '../../../../utils';
import {tagsService} from '../../../../services';

export default async function (
  parent: null,
  args: ChildSleepMutationsTrackArgs,
  ctx: ResolversContext
): Promise<SleepRecordPayload> {
  const {childId, sleep} = args;
  const {me} = ctx;

  if (!sleep.bedTime || !sleep.wakeUpTime) {
    throw new UserInputError('BedTime and WakeUpTime are required');
  }

  const child = await ChildModel.findById(childId);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Incorrect child id');
  }

  const user = await UserModel.findOne({_id: me.id})
  const incidents = await tagsService.findTags(TagTypeEnum.Sleep, sleep.incidents, user)
  const record = await SleepModel.create({
    tracked: new Date(),
    date: sleep.date || getCurrentDateFormatted(),
    time: getTimeOfDay(),
    bedTime: sleep.bedTime,
    wakeUpTime: sleep.wakeUpTime,
    notes: sleep.notes,
    incidents,
    child
  });

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
      incidents: record.incidents.map(t => ({
        group: t.group,
        name: t.name,
        type: t.type,
      } as Tag)),
    } as SleepRecord
  } as SleepRecordPayload;
}
