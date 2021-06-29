import {ObjectId} from 'mongodb';
import {ITag} from './tag.interface';

export interface IUser {
  id: string;
  name: unknown;
  email: unknown;
  token: string;
  password: string
  disabled_tags: string[] | ObjectId[] | ITag[]
}
