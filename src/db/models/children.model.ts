import mongoose, { Schema } from 'mongoose';
import { Models } from '..';
import { IChildren } from './types';

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
  }
);

export const Children = mongoose.model<IChildren>(
  Models.Children,
  childrenSchema
);
