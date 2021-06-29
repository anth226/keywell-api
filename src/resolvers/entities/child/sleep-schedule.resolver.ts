import _ from 'lodash'
import type {ReqContext} from '../../../context'
import {SleepSchedule} from '../../../types/schema.types';

export default async function sleepScheduleResolver(parent, args: null, ctx: ReqContext): Promise<SleepSchedule[]> {
  if (_.isNil(parent.id)) {
    return []
  }
  const results = await ctx.childSleepScheduleLoader.load(parent.id) 

  return results.map(item => ({
    id: item.id,
    bedTime: {
      from: item.bedTime?.from,
      to: item.bedTime?.to,
    },
    sendReminder: item.sendReminder,
    wakeUpTime: {
      from: item.wakeUpTime?.from,
      to: item.wakeUpTime?.to,
    },
    days: item.days
  }))
}
