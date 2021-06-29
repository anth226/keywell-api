
import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {DayOfWeek} from '../../types/schema.types';
import {IChildSleepSchedule} from '../interfaces/child-sleep-schedule.interface';
import {timeRangeSchema} from './common';

const childSleepScheduleSchema = new Schema(
  {
    child: {
      type: Schema.Types.ObjectId,
      ref: Models.Children,
    },
    bedTime: {
      type: timeRangeSchema,
    },
    wakeUpTime: {
      type: timeRangeSchema,
    },
    days: [{
      type: String,
      enum: Object.values(DayOfWeek),
    }],
    sendReminder: {
      type: Boolean,
      default: false,
      require: true
    }
  },
  {
    timestamps: true,
    collection: 'child_sleep_schedules',
  },
)

export const ChildSleepScheduleModel = mongoose.model<IChildSleepSchedule>(Models.ChildSleepSchedule, childSleepScheduleSchema);
