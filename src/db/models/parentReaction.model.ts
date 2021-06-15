import mongoose, { Schema } from 'mongoose';
import { Models } from '..';
import { IParentReaction } from './types';
import { Feelings } from '../../resolvers/types'

const parentReactionSchema = new Schema(
  {
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: Models.BehaviorTag,
        require: true,
      },
    ],
    feeling: {
      type: String,
      enum: [Feelings.calm, Feelings.happy, Feelings.proud, Feelings.sad],
      require: false,
    },
    behavior_record_id: {
      type: Schema.Types.ObjectId,
      ref: Models.BehaviorRecord,
      require: true,
      select: false, // as default, this field should be not populated.
    },
  },
  {
    timestamps: true,
  }
);

export const ParentReaction = mongoose.model<IParentReaction>(
  Models.ParentReaction,
  parentReactionSchema
);
