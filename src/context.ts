import {ExpressContext} from 'apollo-server-express'
import {Db} from 'mongodb';
import {ChildMedicationLoader, ChildSleepScheduleLoader, DiagnosisLoader, MedicationLoader} from './loader';
import {UserData} from './tools/auth';
import {TagLoader} from './loader/tag.loader';
import {TagsLoader} from './loader/tags.loader';

export interface ResolversContext {
  db: Db
  me?: UserData
}

export interface DataLoaderContext {
  diagnosesLoader: DiagnosisLoader
  childMedicationsLoader: ChildMedicationLoader
  medicationLoader: MedicationLoader
  tagLoader: TagLoader
  tagsLoader: TagsLoader
  childSleepScheduleLoader: ChildSleepScheduleLoader
}

export type ReqContext = ExpressContext & ResolversContext & DataLoaderContext

