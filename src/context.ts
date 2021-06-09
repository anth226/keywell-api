import {Db} from 'mongodb';
import { UserData } from './tools/auth';

export interface ResolversContext {
    db: Db
    me?: UserData
}
