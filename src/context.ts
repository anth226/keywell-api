import { ExpressContext } from 'apollo-server-express'
import {Db} from 'mongodb';
import { DiagnosisLoader } from './loader';
import { UserData } from './tools/auth';

export interface ResolversContext {
    db: Db
    me?: UserData
}

export type ReqContext = ExpressContext & {
  db: Db
  me?: UserData
  diagnosesLoader: DiagnosisLoader
}
