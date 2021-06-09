import mongoose, { Schema, Document } from 'mongoose';
import { Models } from '..';

export interface IDiagnosis extends Document {
  id: string;
  name: string;
  user_id: string;
}

const diagnosisSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    // user who created this diagnose
    user_id: {
      type: Schema.Types.ObjectId,
      ref: Models.User
    },
  },
  {
    timestamps: true
  }
);

export const Diagnoses = mongoose.model<IDiagnosis>(Models.Diagnoses, diagnosisSchema);
