import mongoose, {Schema} from 'mongoose';
import {Models} from '..';
import {TagTypeEnum} from '../../types/schema.types';
import {DefaultTagGroup, ITag} from '../interfaces/tag.interface';

export const TagModel = mongoose.model<ITag>(
  Models.Tag,
  new Schema(
    {
      name: {
        type: String,
        require: true,
      },
      group: {
        type: String,
        required: true,
        default: DefaultTagGroup
      },
      type: {
        type: String,
        enum: Object.values(TagTypeEnum),
      },
      order: {
        type: Number,
      }
    },
    {
      timestamps: true
    }
  ).index({name: 1, group: 1, type: 1}, {unique: true}));
