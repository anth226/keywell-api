import _ from 'lodash'
import {SleepSchedule, TimeRange} from '../../../types/schema.types'

export default {
  bedTime: (parent: SleepSchedule): TimeRange => {
    const {bedTime} = parent
    if (_.isNil(bedTime) || JSON.stringify(bedTime) === '{}') {
      // bedTime require not null so has to return 
      return {
        from: '00:00',
        to: '00:00',
      }
    }
    return {
      from: bedTime.from,
      to: bedTime.to
    }
  },
  wakeUpTime: (parent: SleepSchedule): TimeRange => {
    const {wakeUpTime} = parent
    if (_.isNil(wakeUpTime) || JSON.stringify(wakeUpTime) === '{}') {
      // wakeUpTime require not null so has to return 
      return {
        from: '00:00',
        to: '00:00',
      }
    }
    return {
      from: wakeUpTime.from,
      to: wakeUpTime.to
    }
  }
}
