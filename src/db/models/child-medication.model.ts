import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {DayOfWeek} from '../../types/schema.types';
import {IChildMedication} from '../interfaces/medication.interface';

export const ChildMedicationModel = mongoose.model<IChildMedication>(
  Models.ChildMedication,
  new Schema(
    {
      medication: {
        type: Schema.Types.ObjectId,
        ref: Models.Medication,
      },
      child: {
        type: Schema.Types.ObjectId,
        ref: Models.Children,
      },
      dose: {
        type: String,
      },
      scheduleTime: {
        type: new Schema(
          {
            from: {
              type: String,
              require: true
            },
            to: {
              type: String,
              require: true
            },
          },
          {
            _id: false
          }
        ),
      },
      doseAmount: {
        type: Number,
      },
      days: [{
        type: String,
        enum: Object.values(DayOfWeek),
      }],
      sendReminder: {
        type: Boolean,
        default: false,
        require: true
      }
    },
    {
      timestamps: true,
      collection: 'child_medications',
    },
  ));
