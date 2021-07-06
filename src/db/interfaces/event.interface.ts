import {ITag} from './tag.interface';

import {TimeOfDay} from '../../types/schema.types';
import {IChild} from './child.interface';
import {IChildMedication} from './medication.interface';
import {ObjectId} from 'mongoose';
import * as mongoose from 'mongoose';
import {EventRecordType} from '../models';

export default interface IEventRecord extends mongoose.Document {
  id: string;
  child: string | ObjectId | IChild,
  tracked: Date;
  date: string;
  time: TimeOfDay;
  notes?: string;
  __type?: EventRecordType
}

export interface IActivityRecord extends IEventRecord {
  tags: ObjectId[] | ITag[]
}

export interface IMedicationRecord extends IEventRecord {
  childMedication: string | ObjectId | IChildMedication,
}

export interface IParentReaction {
  tags: string[] | ObjectId[] | ITag[]
  feelings: string[] | ObjectId[] | ITag[]
}

export interface IBehaviorRecord extends IEventRecord {
  tags: ObjectId[] | ITag[]
  reaction: IParentReaction
}

export interface ITherapyRecord extends IEventRecord {
  tags: ObjectId[] | ITag[]
}

export interface ISleepRecord extends IEventRecord {
  bedTime: string;
  wakeUpTime: string;
  incidents: ObjectId[] | ITag[];
}
