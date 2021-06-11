import mongoose, { Schema } from 'mongoose';
import { Models } from '..';
import {
  BehaviorRecord as IBehaviorRecord,
  TimeOfDay,
} from '../../types/schema.types';

export interface IParentReaction {
  tags: string[];
  feeling: string;
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
