import DataLoader from 'dataloader'
import _ from 'lodash'
import {ChildSleepScheduleModel} from '../db/models'
import {IChildSleepSchedule} from '../db/interfaces/child-sleep-schedule.interface';

export type ChildSleepScheduleLoader = DataLoader<string, IChildSleepSchedule[]>

export const childSleepScheduleLoader = (): ChildSleepScheduleLoader => new DataLoader<string, IChildSleepSchedule[]>(
  async (ids: string[] | any): Promise<IChildSleepSchedule[][] | Error[] | null> => {
    try {
      const records: IChildSleepSchedule[] = await ChildSleepScheduleModel.find({
        child: {
          $in: ids
        },
      })
      if (_.isEmpty(records)) {
        return ids.map(_id => [])
      }
      
      return ids.map((id) => records.filter((r) => r.child.toString() === id.toString()))
    } catch (error) {
      console.error(error)
      return ids.map(_id => null)
    }
  })
