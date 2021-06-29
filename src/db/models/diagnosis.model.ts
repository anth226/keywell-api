import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {IDiagnosis} from '../interfaces/diagnosis.interface';

export const DiagnosisModel = mongoose.model<IDiagnosis>(
  Models.Diagnoses,
  new Schema(
    {
      name: {
        type: String,
        require: true,
      },
      // user who created this diagnosis
      user: {
        type: Schema.Types.ObjectId,
        ref: Models.User
      },
    },
    {
      timestamps: true
    }
  ));
