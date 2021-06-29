import {IUser} from './user.interface';
import {IDiagnosis} from './diagnosis.interface';
import {ObjectId} from 'mongoose';

export interface IChild {
  id: string;
  name: unknown;
  age: number
  user: string | ObjectId | IUser;
  diagnoses: string[] | ObjectId[] | IDiagnosis[];
}
