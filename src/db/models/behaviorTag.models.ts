import mongoose, { Schema, Document } from 'mongoose';
import { Models } from '..';

export interface IBehaviorTag extends Document {
  id: string;
  name: string;
  group: string;
  order: number;
  user_id: string;
  enabled: boolean;
}

const behaviorTagSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    group: {
      type: String,
      require: true,
    },
    order: {
      type: Number,
      require: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: Models.User,
    },
    enabled: {
      type: Boolean,
      require: true,
    },
  },
  {
    timestamps: true,
    collection: 'behaviorTag',
  }
);

export const BehaviorTagModel = mongoose.model<IBehaviorTag>(
  Models.BehaviorTag,
  behaviorTagSchema
);
