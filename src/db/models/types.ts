import { TimeOfDay, BehaviorTag } from '../../types/schema.types';
import { Document } from 'mongoose';
import { BehaviorGroup } from '../../types/schema.types';

export interface IParentReaction {
  id: string;
  tags: string[];
  feeling: string;
}

export interface IBehaviorRecord {
  id: string;
  reaction?: IParentReaction;
  tags: BehaviorTag[];
  time: TimeOfDay;
  tracked: Date;
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


