
import mongoose, { Schema, Document, Types } from 'mongoose';
import { Models } from '..';
import { DayOfWeek, TimeRange } from '../../types/schema.types';
import { IMedication } from './medication.model';

export interface IChildMedication extends Document {
  id: string;
  medication_id: string
  medication: IMedication;
  child_id: string | Types.ObjectId
  dose?: string
  scheduleTime?: TimeRange;
  doseAmount?: number
  days?: [DayOfWeek]
  sendReminder: boolean
}

const timeRangeSchema = new Schema(
  {
    from: {
      type: Date,
      require: true
    },
    to: {
      type: Date,
      require: true
    },
  },
  {
    _id: false
  }
)

const childrenMedicationSchema = new Schema(
  {
    medication_id: {
      type: Schema.Types.ObjectId,
      ref: Models.Medication,
    },
    child_id: {
      type: Schema.Types.ObjectId,
      ref: Models.Children,
    },
    dose: {
      type: String,
    },
    scheduleTime: {
      type: timeRangeSchema,
    },
    doseAmount: {
      type: Number
    },
    days: [{
      type: String,
      enum: Object.values(DayOfWeek),
    }],
    sendReminder: {
      type: Boolean,
      require: true
    }
  },
  {
    timestamps: true,
    collection: 'child_medications',
  },
)

export const ChildMedication = mongoose.model<IChildMedication>(Models.ChildrenMedication, childrenMedicationSchema);
