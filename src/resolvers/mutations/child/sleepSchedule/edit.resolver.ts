import _ from 'lodash'
import {UserInputError} from 'apollo-server'
import type {ResolversContext} from '../../../../context'
import {ChildModel} from '../../../../db/models'
import {
  SleepScheduleUpdateInput,
  SleepScheduleMutationsEditArgs,
  SleepSchedulePayload,
} from '../../../../types/schema.types'
import {compareIds} from '../../../../utils'
import {ChildSleepScheduleModel} from '../../../../db/models'
import {IChildSleepSchedule} from '../../../../db/interfaces'

export default async function editChiSchedule(
  parent: null,
  args: SleepScheduleMutationsEditArgs,
  ctx: ResolversContext,
): Promise<SleepSchedulePayload> {
  const {id, schedule} = args
  if (!id.trim()) {
    throw new UserInputError('Cannot input empty childSleepScheduleId')
  }
  // check if ChildMedication exist
  const exist = await ChildSleepScheduleModel.findOne({
    _id: id,
  })
  if (!exist) {
    throw new UserInputError('Child sleep schedule Id cannot be found')
  }
  // check if Child belong to
  const child = await ChildModel.findOne({_id: exist.child})
  if (!child || !compareIds(child.user, ctx.me.id)) {
    throw new UserInputError('Child cannot be found')
  }

  const updateObj = getUpdateObj(schedule, exist)

  const childSleepSchedule = await ChildSleepScheduleModel.findOneAndUpdate(
    {
      _id: id,
    },
    updateObj,
    {
      new: true,
      omitUndefined: true,
    }
  )

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
    },
  }
}

function getUpdateObj(
  input: SleepScheduleUpdateInput,
  exist: IChildSleepSchedule,
): Record<string, any> {
  const {bedTime, wakeUpTime, days} = _.omitBy(
    input,
    _.isNil,
  ) as SleepScheduleUpdateInput
  const updateObj: SleepScheduleUpdateInput = {}
  // bedTime
  let _bedTime = {
    from: exist.bedTime?.from,
    to: exist.bedTime?.to,
  }
  if (!_.isNil(bedTime) && !_.isEmpty(bedTime)) {
    _bedTime = {
      from: bedTime.from,
      to: bedTime.to,
    }
  }
  updateObj.bedTime = _bedTime
  //
  let _wakeUpTime = {
    from: exist.wakeUpTime?.from,
    to: exist.wakeUpTime?.to,
  }
  if (!_.isNil(wakeUpTime) && !_.isEmpty(wakeUpTime)) {
    _wakeUpTime = {
      from: wakeUpTime.from,
      to: wakeUpTime.to,
    }
  }
  updateObj.wakeUpTime = _wakeUpTime

  if (!_.isNil(days)) {
    updateObj.days = _.uniq(days)
  }

  return updateObj
}
