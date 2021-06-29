import _ from 'lodash'
import {ChildMedication, TimeRange} from '../../../../types/schema.types'
import medicationResolver from './medication.resolver'

export default {
  doseAmount: (parent: ChildMedication): number | null => {
    const {doseAmount} = parent
    if (_.isNil(doseAmount)) {
      return null
    }
    return doseAmount
  },
  dose: (parent: ChildMedication): string | null => {
    const {dose} = parent
    if (_.isNil(dose)) {
      return null
    }
    return dose
  },
  scheduleTime: (parent: ChildMedication): TimeRange | null => {
    const {scheduleTime} = parent
    // somehow _.isEmpty(scheduleTime) = false here?
    if (_.isNil(scheduleTime) || JSON.stringify(scheduleTime) === '{}') {
      return null
    }
    return {
      from: scheduleTime.from,
      to: scheduleTime.to
    }
  },
  medication: medicationResolver
}
