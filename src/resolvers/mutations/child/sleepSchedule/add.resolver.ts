import _ from 'lodash'
import {UserInputError} from 'apollo-server'
import type {ResolversContext} from '../../../../context'
import {ChildModel} from '../../../../db/models'
import {
  SleepScheduleMutationsAddArgs,
  SleepSchedulePayload,
  TimeRangeInput,
} from '../../../../types/schema.types'
import {compareTime} from '../../../../utils'
import {ChildSleepScheduleModel} from '../../../../db/models'

export default async function (
  parent: null,
  args: SleepScheduleMutationsAddArgs,
  ctx: ResolversContext,
): Promise<SleepSchedulePayload> {
  const {childId, schedule} = args
  if (!childId.trim()) {
    throw new UserInputError('Child must not be empty')
  }
  const {bedTime, wakeUpTime} = schedule
  validateTimeRange(bedTime)
  validateTimeRange(wakeUpTime)

  // check if child exist and belong to authenticated user
  const child = await ChildModel.findOne({
    _id: childId,
    user: ctx.me?.id,
  })
  if (_.isNil(child)) {
    throw new UserInputError('Child is not exist')
  }
  const childSleepSchedule = await ChildSleepScheduleModel.create({
    child: childId,
    bedTime: {
      from: bedTime.from,
      to: bedTime.to,
    },
    wakeUpTime: {
      from: wakeUpTime.from,
      to: wakeUpTime.to,
    },
    days: _.uniq(args.schedule?.days || [])
  })

  return {
    id: childSleepSchedule.id,
    schedule: {
      id: childSleepSchedule.id,
      bedTime: {
        from: childSleepSchedule.bedTime?.from,
        to: childSleepSchedule.bedTime?.to,
      },
      wakeUpTime: {
        from: childSleepSchedule.wakeUpTime?.from,
        to: childSleepSchedule.wakeUpTime?.to,
      },
      sendReminder: childSleepSchedule.sendReminder,
      days: childSleepSchedule.days,
    }
  }
}

function validateTimeRange(input: TimeRangeInput) {
  // by pass if no value provided
  if (_.isNil(input.from) && _.isNil(input.to)) {
    return
  }
  const {from, to} = compareTime({
    from: input.from,
    to: input.to
  })
  if (!from || !to) {
    throw new UserInputError('Time range is not valid')
  }
  return {from, to}
}
