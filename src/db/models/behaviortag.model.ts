
import mongoose, { Schema, Document } from 'mongoose';
import { Models } from '..';
import { BehaviorGroup } from '../../types/schema.types'

export interface IBehaviorTag extends Document {
  name: string;
  group: BehaviorGroup;
}

const behaviorTagSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    group: {
      type: String,
      enum: ['DESIRABLE', 'UNDESIRABLE'],
      default: 'DESIRABLE'   
    },
    order: {
      type: Number,
      default: 0
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: Models.User,
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

behaviorTagSchema.index({name: 1, user_id: 1}, { unique: true})

export const BehaviorTag = mongoose.model<IBehaviorTag>(Models.BehaviorTag, behaviorTagSchema);
