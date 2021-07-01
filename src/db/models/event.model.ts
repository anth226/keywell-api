import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {TimeOfDay} from '../../types/schema.types';
import IEventRecord, {IActivityRecord, IBehaviorRecord, ITherapyRecord} from '../interfaces/event.interface';
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
})

eventSchema.plugin(softDeletePlugin)

export const EventModel = mongoose.model<IEventRecord>('Event', eventSchema);

export const BehaviorModel = EventModel.discriminator<IBehaviorRecord>('Behavior',
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
            feeling: {
              type: Schema.Types.ObjectId,
              ref: Models.Tag,
              require: true,
            },
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

export const ActivityModel = EventModel.discriminator<IActivityRecord>('Activity', new Schema(
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

export const TherapyModel = EventModel.discriminator<ITherapyRecord>('Therapy', new Schema(
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

