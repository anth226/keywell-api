import mongoose, { Schema, Document } from 'mongoose';
import { Models } from '..';

export interface IMedication extends Document {
  id: string;
  name: string;
  user_id: string;
  availableDoses: string[];
}

const medicationSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    availableDoses: [{
      type: String
    }],
    // user who created this medication
    user_id: {
      type: Schema.Types.ObjectId,
      ref: Models.User
    }
  },
  {
    timestamps: true
  }
);

export const Medication = mongoose.model<IMedication>(Models.Medication, medicationSchema);
