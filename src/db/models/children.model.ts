
import mongoose, { Schema, Document } from 'mongoose';
import { Models } from '..';

export interface IChildren extends Document {
  id: string;
  name: unknown;
  age: number
  user_id: string;
  diagnoses_id: string[];
}

const childrenSchema = new Schema(
  {
    name: {
      type: Buffer,
      require: true,
    },
    age: {
      type: Number,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: Models.User,
    },
    diagnoses_id: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: Models.Diagnoses,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'children',
  },
)

export const Children = mongoose.model<IChildren>(Models.Children, childrenSchema);
