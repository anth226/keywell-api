import {ObjectId} from 'mongoose';
import {DayOfWeek, TimeRange} from '../../types/schema.types';

export interface IChildSleepSchedule{
  id: string;
  child: string | ObjectId
  bedTime?: TimeRange
  wakeUpTime?: TimeRange
  days?: [DayOfWeek]
  sendReminder: boolean
}