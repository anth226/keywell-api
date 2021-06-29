import {Schema} from 'mongoose';

export const timeRangeSchema = new Schema(
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
)
