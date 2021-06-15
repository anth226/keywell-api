
import mongoose, { Schema } from 'mongoose';
import { Models } from '..';
import { IBehaviorTag } from './types';
import { BehaviorGroup } from '../../types/schema.types';

const behaviorTagSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    group: {
      type: String,
      enum: [BehaviorGroup.Desirable, BehaviorGroup.Undesirable],
      default: BehaviorGroup.Desirable 
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
