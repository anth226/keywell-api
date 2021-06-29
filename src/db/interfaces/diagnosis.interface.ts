import {IUser} from './user.interface';
import {ObjectId} from 'mongoose';

export interface IDiagnosis {
  id: string
  name: string
  user: string | ObjectId | IUser
}
