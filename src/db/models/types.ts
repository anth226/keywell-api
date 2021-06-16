import { TimeOfDay, BehaviorTag } from '../../types/schema.types';
import { Document } from 'mongoose';
import { BehaviorGroup } from '../../types/schema.types';

export interface IParentReaction extends Document {
  id: string;
  tags: string[];
  feeling: string;
  behavior_record_id?: string;
}

export interface IBehaviorRecord extends Document {
  id: string;
  reaction?: IParentReaction;
  tags: BehaviorTag[];
  time: TimeOfDay;
  tracked: Date;
  child_id?: string;
}

export interface IChildren extends Document {
  id: string;
  name: unknown;
  age: number;
  user_id: string;
  diagnoses_id: string[];
}

export interface IBehaviorTag extends Document {
  name: string;
  group: BehaviorGroup;
}


