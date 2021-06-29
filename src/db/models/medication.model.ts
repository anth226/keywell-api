import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {IMedication} from '../interfaces/medication.interface';

export const MedicationModel = mongoose.model<IMedication>(
  Models.Medication, new Schema(
    {
      name: {
        type: String,
        require: true,
      },
      availableDoses: [{
        type: String
      }],
      // user who created this medication
      user: {
        type: Schema.Types.ObjectId,
        ref: Models.User
      }
    },
    {
      timestamps: true
    }
  ));
