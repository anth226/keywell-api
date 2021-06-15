import mongoose, { Schema } from 'mongoose';
import { Models } from '..';
import { TimeOfDay } from '../../types/schema.types';
import { IBehaviorRecord } from './types';

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
    child_id: {
      type: Schema.Types.ObjectId,
      ref: Models.Children,
      require: true,
      select: false, // as default, this field should be not populated.
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
