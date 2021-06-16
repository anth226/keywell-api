import { BehaviorRecord } from '../types/schema.types';
import { IChildren } from '../db/models/types'

// TODO: should be replace with real db data.
export enum Feelings {
  calm = 'CALM',
  happy = 'HAPPY',
  proud = 'PROUD',
  sad = 'SAD',
}

export interface IBehaviorRecordWithChildId extends BehaviorRecord {
  child_id?: string | IChildren;
}
