import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {IUser} from '../interfaces/user.interface';

export const UserModel = mongoose.model<IUser>(Models.User, new Schema(
  {
    name: {
      type: Buffer,
      require: true,
    },
    email: {
      type: Buffer,
      require: true,
    },
    token: {
      type: String
    },
    password: {
      type: String
    },
    disabled_tags: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: Models.Tag,
        },
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
));
