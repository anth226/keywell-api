import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {TimeOfDay} from '../../types/schema.types';
import IEventRecord, {
  IActivityRecord,
  IBehaviorRecord,
  IMedicationRecord,
  ITherapyRecord,
  ISleepRecord
} from '../interfaces/event.interface';

import {softDeletePlugin} from '../plugins/softdelete';

const eventSchema = new Schema({
    tracked: {
      type: Schema.Types.Date,
      require: true,
      default: new Date(),
    },
    date: {
      type: String,
      require: true
    },
    time: {
      type: String,
      enum: Object.values(TimeOfDay),
      require: true
    },
    child: {
      type: Schema.Types.ObjectId,
      ref: Models.Children,
      require: true
    },
    notes: {
      type: String,
      require: false
    },
  },
  {
    discriminatorKey: '__type',
    collection: 'events',
    timestamps: true
  }).index({date: 1})

eventSchema.plugin(softDeletePlugin)

export const EventModel = mongoose.model<IEventRecord>('Event', eventSchema);

export enum EventRecordType {
  Behavior = 'Behavior',
  Activity = 'Activity',
  Therapy = 'Therapy',
  Sleep = 'Sleep',
  Medication = 'Medication',
}

export const BehaviorModel = EventModel.discriminator<IBehaviorRecord>(EventRecordType.Behavior,
  new Schema(
    {
      tags: [
        {
          type: Schema.Types.ObjectId,
          ref: Models.Tag,
          require: true,
        },
      ],
      reaction: {
        type: new Schema(
          {
            tags: [
              {
                type: Schema.Types.ObjectId,
                ref: Models.Tag,
                require: true,
              },
            ],
            feelings: [{
              type: Schema.Types.ObjectId,
              ref: Models.Tag,
              require: true,
            }],
          },
          {
            _id: false,
          }
        ),
      }
    },
    {
      timestamps: true,
    }
  )
);

export const ActivityModel = EventModel.discriminator<IActivityRecord>(EventRecordType.Activity, new Schema(
  {
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: Models.Tag,
        require: true,
      },
    ]
  }
));

export const MedicationRecordModel = EventModel.discriminator<IMedicationRecord>(EventRecordType.Medication, new Schema(
  {
    childMedication: {
      type: Schema.Types.ObjectId,
      ref: Models.ChildMedication,
      require: true
    },
  }
));

export const TherapyModel = EventModel.discriminator<ITherapyRecord>(EventRecordType.Therapy, new Schema(
  {
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: Models.Tag,
        require: true,
      },
    ]
  }
));

export const SleepModel = EventModel.discriminator<ISleepRecord>(EventRecordType.Sleep, new Schema(
  {
    bedTime: {
      type: String,
      require: true
    },
    wakeUpTime: {
      type: String,
      require: true
    },
    incidents: [
      {
        type: Schema.Types.ObjectId,
        ref: Models.Tag,
        require: true,
      },
    ]
  }
));
