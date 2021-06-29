import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {IChild} from '../interfaces/child.interface';

export const ChildModel = mongoose.model<IChild>(
  Models.Children,
  new Schema(
    {
      name: {
        type: Buffer,
        require: true,
      },
      age: {
        type: Number,
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: Models.User,
      },
      diagnoses: {
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
  ));
