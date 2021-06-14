import mongoose, { Schema } from 'mongoose';
import { Models } from '..';
import {
  TimeOfDay,
  BehaviorTag,
} from '../../types/schema.types';

export interface IParentReaction {
  id: string
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


const behaviorRecordSchema = new Schema(
  {
    tracked: {
      type: Schema.Types.Date,
      require: true,
      default: new Date(), 
    },
    time: {
      type: String,
      enum: [TimeOfDay.Morning, TimeOfDay.Afternoon, TimeOfDay.Evening],
      require: true,
      default: TimeOfDay.Morning,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: Models.BehaviorTag,
        require: true,
      },
    ],
    reaction: {
      tags: {
        type: Schema.Types.ObjectId,
        ref: Models.BehaviorTag,
      },
      feeling: {
        type: String,
      },
      require: false,
    },
  },
  {
    timestamps: true,
  }
);

export const BehaviorRecord = mongoose.model<IBehaviorRecord>(
  Models.BehaviorRecord,
  behaviorRecordSchema
);
