import {IUser} from './user.interface';
import {DayOfWeek} from '../../types/schema.types';
import {IChild} from './child.interface';
import {ObjectId} from 'mongoose';

export interface IMedication {
  id: string;
  name: string;
  user: string | ObjectId | IUser
  availableDoses: string[]
}

interface IScheduleTime {
  from: string
  to: string
}

export interface IChildMedication {
  id: string;
  medication: string | ObjectId | IMedication
  child: string | ObjectId | IChild
  dose?: string
  scheduleTime?: IScheduleTime
  doseAmount?: number
  days?: [DayOfWeek]
  sendReminder: boolean
  user: string | ObjectId | IUser
}
