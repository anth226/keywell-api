import {ITag} from './tag.interface';

import {TimeOfDay} from '../../types/schema.types';
import {IChild} from './child.interface';
import {ObjectId} from 'mongoose';
import * as mongoose from 'mongoose';

export default interface IEventRecord extends mongoose.Document {
  id: string;
  child: string | ObjectId | IChild,
  tracked: Date;
  date: string;
  time: TimeOfDay;
  notes?: string;
}

export interface IActivityRecord extends IEventRecord {
  tags: ObjectId[] | ITag[]
}

export interface IParentReaction {
  tags: string[] | ObjectId[] | ITag[]
  feeling: string | ObjectId | ITag
}

export interface IBehaviorRecord extends IEventRecord {
  tags: ObjectId[] | ITag[],
  reaction: IParentReaction
}

export interface ITherapyRecord extends IEventRecord {
  tags: ObjectId[] | ITag[]
}
