
import mongoose, { Schema, Document } from 'mongoose';
import { Models } from '..';

export interface IUser extends Document {
  id: string;
  name: unknown;
  email: unknown;
  token: string;
  password: string
}

const userSchema = new Schema(
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
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>(Models.User, userSchema);
