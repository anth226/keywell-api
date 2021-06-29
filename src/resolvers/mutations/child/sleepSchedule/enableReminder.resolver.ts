
import {UserInputError} from 'apollo-server';
import type {ReqContext} from '../../../../context';
import {ChildSleepScheduleModel, ChildModel} from '../../../../db/models';
import {SleepScheduleMutationsEnableReminderArgs, SleepSchedulePayload} from '../../../../types/schema.types';
import {compareIds} from '../../../../utils';

export default async function (parent: null, args: SleepScheduleMutationsEnableReminderArgs, ctx: ReqContext): Promise<SleepSchedulePayload> {
  const {id: sleepScheduleId, enabled = true} = args
  if (!sleepScheduleId || !sleepScheduleId.trim()) {
    throw new UserInputError('Child sleep schedule Id cannot be empty')
  }
  const exist = await ChildSleepScheduleModel.findOne({
    _id: sleepScheduleId,
  })
  if (!exist) {
    throw new UserInputError('Child sleep schedule Id cannot be found')
  }
  const child = await ChildModel.findOne({_id: exist.child})
  if (!child || !compareIds(child.user, ctx.me.id)) {
    throw new UserInputError('Child cannot be found')
  }
  
  const updated = await ChildSleepScheduleModel.findOneAndUpdate({
    _id: sleepScheduleId
  }, {
    sendReminder: enabled
  }, {
    new: true
  })

  const {id, sendReminder, days, wakeUpTime, bedTime} = updated
  return {
    id: sleepScheduleId,
    schedule: {
      id,
      sendReminder,
      days,
      wakeUpTime: {
        from: wakeUpTime?.from,
        to: wakeUpTime?.to,
      },
      bedTime: {
        from: bedTime?.from,
        to: bedTime?.to,
      },
    }
  }
}