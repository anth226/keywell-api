export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** ISO date, e.g. "2020-01-01" */
  Date: any;
  /** ISO date time, e.g. "2021-05-07T07:30:21+00:00" */
  DateTime: any;
  /** ISO 24-hour time "hh:mm" */
  Time: any;
}

export interface ActivityRecord extends TrackedEvent {
  __typename?: 'ActivityRecord';
  date: Scalars['Date'];
  id: Scalars['ID'];
  notes?: Maybe<Scalars['String']>;
  tags: Array<Tag>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
}

export interface ActivityRecordInput {
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
  tags: Array<Scalars['String']>;
}

export interface ActivityRecordPayload {
  __typename?: 'ActivityRecordPayload';
  activity: ActivityRecord;
  id: Scalars['ID'];
}

export interface AddChildDiagnosisPayload {
  __typename?: 'AddChildDiagnosisPayload';
  added: Scalars['Boolean'];
  id: Scalars['ID'];
}

export interface BehaviorProgress {
  __typename?: 'BehaviorProgress';
  /** Tag group name. */
  group: Scalars['String'];
  /** 0-100, can be negative or positive. */
  percentage?: Maybe<Scalars['Int']>;
  /** 0.. infinity. */
  streakDays?: Maybe<Scalars['Int']>;
  /** You've reached this milestone XX times before.. (applies to streakDays only) */
  streakDaysTimesReachedBefore?: Maybe<Scalars['Int']>;
}

export interface BehaviorRecord extends TrackedEvent {
  __typename?: 'BehaviorRecord';
  date: Scalars['Date'];
  id: Scalars['ID'];
  notes?: Maybe<Scalars['String']>;
  reaction?: Maybe<ParentReaction>;
  tags: Array<Tag>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
}

export interface BehaviorRecordInput {
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
  /** taken from BehaviorTag.name */
  tags: Array<Scalars['String']>;
}

export interface BehaviorRecordPayload {
  __typename?: 'BehaviorRecordPayload';
  behavior: BehaviorRecord;
  id: Scalars['ID'];
}

export interface Child {
  __typename?: 'Child';
  age?: Maybe<Scalars['Int']>;
  /** Registered diagnoses. */
  diagnoses?: Maybe<Array<Diagnosis>>;
  id: Scalars['ID'];
  /**
   * Medications or supplements a child
   * takes on a regular basis.
   */
  medications?: Maybe<Array<ChildMedication>>;
  name: Scalars['String'];
  /**
   * Sleep schedule for the child.
   * Can be of size 1 or 2.
   * Only 1 item means the whole week schedule.
   * 2 items means separate schedule for weekdays,
   * and weekends.
   */
  sleepSchedule?: Maybe<Array<SleepSchedule>>;
}

export interface ChildActivityMutations {
  __typename?: 'ChildActivityMutations';
  edit?: Maybe<ActivityRecordPayload>;
  track?: Maybe<ActivityRecordPayload>;
}


export interface ChildActivityMutationsEditArgs {
  activity: ActivityRecordInput;
  id: Scalars['ID'];
}


export interface ChildActivityMutationsTrackArgs {
  activity: ActivityRecordInput;
  childId: Scalars['ID'];
}

export interface ChildBehaviorMutations {
  __typename?: 'ChildBehaviorMutations';
  edit?: Maybe<BehaviorRecordPayload>;
  track?: Maybe<BehaviorRecordPayload>;
  trackReaction?: Maybe<ParentReactionPayload>;
}


export interface ChildBehaviorMutationsEditArgs {
  behavior: BehaviorRecordInput;
  id: Scalars['ID'];
}


export interface ChildBehaviorMutationsTrackArgs {
  behavior: BehaviorRecordInput;
  childId: Scalars['ID'];
}


export interface ChildBehaviorMutationsTrackReactionArgs {
  reaction: ParentReactionInput;
  trackedBehaviorId: Scalars['ID'];
}

export interface ChildDiagnosisMutations {
  __typename?: 'ChildDiagnosisMutations';
  add?: Maybe<AddChildDiagnosisPayload>;
  remove?: Maybe<RemoveChildDiagnosisPayload>;
}


export interface ChildDiagnosisMutationsAddArgs {
  childId: Scalars['ID'];
  diagnosisId: Scalars['ID'];
}


export interface ChildDiagnosisMutationsRemoveArgs {
  childId: Scalars['ID'];
  diagnosisId: Scalars['ID'];
}

export interface ChildInput {
  age: Scalars['Int'];
  name: Scalars['String'];
}

export interface ChildMedication {
  __typename?: 'ChildMedication';
  /**
   * If taken on a daily basis, all days are present in this array.
   * Otherwise only the selected days are added.
   * null means no selection of the days were made.
   */
  days?: Maybe<Array<DayOfWeek>>;
  /**
   * Medication dose, arbitrary format.
   * e.g. 5mg
   */
  dose?: Maybe<Scalars['String']>;
  /** How many tablets in this dose etc. */
  doseAmount?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  medication: Medication;
  /** When is this taken? */
  scheduleTime?: Maybe<TimeRange>;
  sendReminder: Scalars['Boolean'];
}

export interface ChildMedicationInput {
  /**
   * If taken on a daily basis, all days are present in this array.
   * Otherwise only the selected days are added.
   */
  days?: Maybe<Array<DayOfWeek>>;
  /**
   * Medication dose, arbitrary format.
   * e.g. 5mg.
   * If new (unknown yet) medication is entered,
   * this dose is saved into the available doses array.
   */
  dose?: Maybe<Scalars['String']>;
  /** How many tablets in this dose etc. */
  doseAmount?: Maybe<Scalars['Int']>;
  /** Add new or select existing medication. */
  medication: MedicationInput;
  sendReminder?: Maybe<Scalars['Boolean']>;
  /** When is this taken? */
  takenFrom?: Maybe<Scalars['Time']>;
  takenTo?: Maybe<Scalars['Time']>;
}

export interface ChildMedicationMutations {
  __typename?: 'ChildMedicationMutations';
  add?: Maybe<ChildMedicationPayload>;
  edit?: Maybe<ChildMedicationPayload>;
  editRecord?: Maybe<MedicationRecordPayload>;
  enableReminder?: Maybe<ChildMedicationPayload>;
  remove?: Maybe<RemoveChildMedicationPayload>;
  track?: Maybe<MedicationRecordPayload>;
}


export interface ChildMedicationMutationsAddArgs {
  childId: Scalars['ID'];
  medication: ChildMedicationInput;
}


export interface ChildMedicationMutationsEditArgs {
  childMedicationId: Scalars['ID'];
  medication: ChildMedicationUpdateInput;
}


export interface ChildMedicationMutationsEditRecordArgs {
  medication: MedicationRecordInput;
  medicationRecordId: Scalars['ID'];
}


export interface ChildMedicationMutationsEnableReminderArgs {
  childMedicationId: Scalars['ID'];
  enabled?: Scalars['Boolean'];
}


export interface ChildMedicationMutationsRemoveArgs {
  childMedicationId: Scalars['ID'];
}


export interface ChildMedicationMutationsTrackArgs {
  medication: MedicationRecordInput;
}

export interface ChildMedicationPayload {
  __typename?: 'ChildMedicationPayload';
  id: Scalars['ID'];
  medication: ChildMedication;
}

export interface ChildMedicationUpdateInput {
  days?: Maybe<Array<DayOfWeek>>;
  dose?: Maybe<Scalars['String']>;
  doseAmount?: Maybe<Scalars['Int']>;
  medication?: Maybe<MedicationInput>;
  sendReminder?: Maybe<Scalars['Boolean']>;
  takenFrom?: Maybe<Scalars['Time']>;
  takenTo?: Maybe<Scalars['Time']>;
}

export interface ChildMutations {
  __typename?: 'ChildMutations';
  activity?: Maybe<ChildActivityMutations>;
  add?: Maybe<ChildProfilePayload>;
  behavior?: Maybe<ChildBehaviorMutations>;
  delete?: Maybe<DeleteChildPayload>;
  deleteRecord?: Maybe<DeletePayload>;
  diagnosis?: Maybe<ChildDiagnosisMutations>;
  edit?: Maybe<ChildProfilePayload>;
  medication?: Maybe<ChildMedicationMutations>;
  sleep?: Maybe<ChildSleepMutations>;
  therapy?: Maybe<ChildTherapyMutations>;
}


export interface ChildMutationsAddArgs {
  input: ChildInput;
}


export interface ChildMutationsDeleteArgs {
  id: Scalars['ID'];
}


export interface ChildMutationsDeleteRecordArgs {
  recordId: Scalars['ID'];
}


export interface ChildMutationsEditArgs {
  id: Scalars['ID'];
  input: ChildInput;
}

export interface ChildProfile {
  __typename?: 'ChildProfile';
  age?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  name: Scalars['String'];
}

export interface ChildProfilePayload {
  __typename?: 'ChildProfilePayload';
  child: ChildProfile;
  id: Scalars['ID'];
}

export interface ChildSleepMutations {
  __typename?: 'ChildSleepMutations';
  editRecord?: Maybe<SleepRecordPayload>;
  schedule?: Maybe<SleepScheduleMutations>;
  track?: Maybe<SleepRecordPayload>;
}


export interface ChildSleepMutationsEditRecordArgs {
  id: Scalars['ID'];
  sleep: SleepRecordInput;
}


export interface ChildSleepMutationsTrackArgs {
  childId: Scalars['ID'];
  sleep: SleepRecordInput;
}

export interface ChildTherapyMutations {
  __typename?: 'ChildTherapyMutations';
  edit?: Maybe<TherapyRecordPayload>;
  track?: Maybe<TherapyRecordPayload>;
}


export interface ChildTherapyMutationsEditArgs {
  id: Scalars['ID'];
  therapy: TherapyRecordInput;
}


export interface ChildTherapyMutationsTrackArgs {
  childId: Scalars['ID'];
  therapy: TherapyRecordInput;
}

export interface ChildrenSortInput {
  createdAt?: Maybe<SortDirection>;
}

export interface CorePagination {
  limit?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
}

export interface DailyInsights {
  __typename?: 'DailyInsights';
  /** All tracked activity for the day. */
  activity: Array<ActivityRecord>;
  /** All behaviour logged, positive and challenging in a single flat array. */
  behavior: Array<BehaviorRecord>;
  date: Scalars['Date'];
  /** All medications tracked. */
  medications: Array<MedicationRecord>;
  /** Sleep record. If tracked. */
  sleep?: Maybe<SleepRecord>;
}



export enum DayOfWeek {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

export interface DeleteChildPayload {
  __typename?: 'DeleteChildPayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
}

export interface DeletePayload {
  __typename?: 'DeletePayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
}

export interface Diagnosis {
  __typename?: 'Diagnosis';
  id: Scalars['ID'];
  name: Scalars['String'];
}

export interface DiagnosisMutationPayload {
  __typename?: 'DiagnosisMutationPayload';
  diagnosis: Diagnosis;
  id: Scalars['ID'];
}

export interface EnableTagPayload {
  __typename?: 'EnableTagPayload';
  enabled: Scalars['Boolean'];
  id: Scalars['ID'];
}

export interface KnownDiagnosesMutations {
  __typename?: 'KnownDiagnosesMutations';
  add?: Maybe<DiagnosisMutationPayload>;
}


export interface KnownDiagnosesMutationsAddArgs {
  name: Scalars['String'];
}

export interface ManagedTag {
  __typename?: 'ManagedTag';
  enabled: Scalars['Boolean'];
  group: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  type: TagTypeEnum;
}

export interface Medication {
  __typename?: 'Medication';
  /** Only filled if known. */
  availableDoses?: Maybe<Array<Scalars['String']>>;
  id: Scalars['ID'];
  name: Scalars['String'];
}

export interface MedicationInput {
  /** Only if medication is already known. */
  id?: Maybe<Scalars['ID']>;
  /** Add new unknown (yet) medication. */
  name?: Maybe<Scalars['String']>;
}

export interface MedicationRecord extends TrackedEvent {
  __typename?: 'MedicationRecord';
  date: Scalars['Date'];
  id: Scalars['ID'];
  medication?: Maybe<ChildMedication>;
  notes?: Maybe<Scalars['String']>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
}

export interface MedicationRecordInput {
  childMedicationId: Scalars['ID'];
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
}

export interface MedicationRecordPayload {
  __typename?: 'MedicationRecordPayload';
  id: Scalars['ID'];
  medication: MedicationRecord;
}

export interface Mutation {
  __typename?: 'Mutation';
  /**
   * Called on app startup, for logged in users.
   * Saves FCM client side token for later use by the server side
   * when sending reminders etc.
   */
  addFcmToken?: Maybe<MedicationRecordPayload>;
  child?: Maybe<ChildMutations>;
  knownDiagnosis?: Maybe<KnownDiagnosesMutations>;
  /**
   * Returns JWT for the logged in user.
   * The JWT returned should contain name, email, and user id claims.
   */
  login: Scalars['String'];
  /**
   * Returns JWT for the newly registered user.
   * The JWT returned should contain name, email, and user id claims.
   */
  register: Scalars['String'];
  tags?: Maybe<TagMutations>;
}


export interface MutationAddFcmTokenArgs {
  token: Scalars['String'];
}


export interface MutationLoginArgs {
  email: Scalars['String'];
  password: Scalars['String'];
}


export interface MutationRegisterArgs {
  email: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
}

export interface ParentReaction {
  __typename?: 'ParentReaction';
  feelings: Array<Tag>;
  tags: Array<Tag>;
}

export interface ParentReactionInput {
  /** can be empty. */
  feelings: Array<Scalars['String']>;
  /** can be empty. */
  tags: Array<Scalars['String']>;
}

export interface ParentReactionPayload {
  __typename?: 'ParentReactionPayload';
  /** Behavior record ID. */
  id: Scalars['ID'];
  reaction: ParentReaction;
}

export interface Profile {
  __typename?: 'Profile';
  email: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
}

export interface ProfilePayload {
  __typename?: 'ProfilePayload';
  id: Scalars['ID'];
  profile: Profile;
}

export interface Query {
  __typename?: 'Query';
  /**
   * Calculate behavior progress, based on the given params.
   * Before and after here means the period start dates.
   * Days will be added to the period start to define period end.
   */
  behaviorProgress?: Maybe<BehaviorProgress>;
  /** Query child by id. */
  child?: Maybe<Child>;
  /** Query all registered children. */
  children: Array<Child>;
  /**
   * List events filtered by date, behavior type.
   * Just another view of timeline events.
   * See the date filter logic above in the timeline query.
   */
  insights: Array<DailyInsights>;
  /** List all known diagnoses with an optional search filter. */
  knownDiagnoses: Array<Diagnosis>;
  /** List all known medications with an optional search filter. */
  knownMedications: Array<Medication>;
  /** Get your own profile. */
  me: Profile;
  /** Returns all tags, enabled and disabled. */
  tagManagement: Array<ManagedTag>;
  tags: Array<Tag>;
  /**
   * All events ordered by date and time.
   * Date filter - both dates should be included into the result.
   * Means that events that happened on date "from" should be included,
   * as well as the events that happened on date "to" (if specified).
   * Both dates can be null, no date filter should be applied in this case.
   * Another extreme case is when both "date" equals to to "date",
   * which means to return only events for that date.
   */
  timeline: TimelineData;
}


export interface QueryBehaviorProgressArgs {
  after: Scalars['Date'];
  before: Scalars['Date'];
  calculatePercentage?: Maybe<Scalars['Boolean']>;
  calculateStreakDays?: Maybe<Scalars['Boolean']>;
  calculateStreakDaysTimesBefore?: Maybe<Scalars['Boolean']>;
  days: Scalars['Int'];
  group: Scalars['String'];
}


export interface QueryChildArgs {
  id: Scalars['ID'];
}


export interface QueryChildrenArgs {
  sortBy?: Maybe<ChildrenSortInput>;
}


export interface QueryInsightsArgs {
  from?: Maybe<Scalars['Date']>;
  group?: Maybe<Scalars['String']>;
  to?: Maybe<Scalars['Date']>;
}


export interface QueryKnownDiagnosesArgs {
  pagination?: Maybe<CorePagination>;
  query?: Maybe<Scalars['String']>;
}


export interface QueryKnownMedicationsArgs {
  pagination?: Maybe<CorePagination>;
  query?: Maybe<Scalars['String']>;
}


export interface QueryTagManagementArgs {
  group?: Maybe<Scalars['String']>;
  type: TagTypeEnum;
}


export interface QueryTagsArgs {
  group?: Maybe<Scalars['String']>;
  type: TagTypeEnum;
}


export interface QueryTimelineArgs {
  from?: Maybe<Scalars['Date']>;
  to?: Maybe<Scalars['Date']>;
}

export interface RemoveChildDiagnosisPayload {
  __typename?: 'RemoveChildDiagnosisPayload';
  id: Scalars['ID'];
  removed: Scalars['Boolean'];
}

export interface RemoveChildMedicationPayload {
  __typename?: 'RemoveChildMedicationPayload';
  /** Deleted record ID. */
  id: Scalars['ID'];
  removed: Scalars['Boolean'];
}

export interface RemoveSleepSchedulePayload {
  __typename?: 'RemoveSleepSchedulePayload';
  /** Deleted record ID. */
  id: Scalars['ID'];
  removed: Scalars['Boolean'];
}

export interface SleepRecord extends TrackedEvent {
  __typename?: 'SleepRecord';
  bedTime: Scalars['Time'];
  date: Scalars['Date'];
  id: Scalars['ID'];
  incidents?: Maybe<Array<Tag>>;
  notes?: Maybe<Scalars['String']>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
  wakeUpTime: Scalars['Time'];
}

export interface SleepRecordInput {
  bedTime: Scalars['Time'];
  /** use current date if omitted */
  date?: Maybe<Scalars['Date']>;
  incidents?: Maybe<Array<Scalars['String']>>;
  notes?: Maybe<Scalars['String']>;
  wakeUpTime: Scalars['Time'];
}

export interface SleepRecordPayload {
  __typename?: 'SleepRecordPayload';
  id: Scalars['ID'];
  sleep: SleepRecord;
}

export interface SleepSchedule {
  __typename?: 'SleepSchedule';
  /** What time a child usually goes to bed during the week. */
  bedTime: TimeRange;
  /** Either all days or weekends/weekdays. */
  days?: Maybe<Array<DayOfWeek>>;
  id: Scalars['ID'];
  sendReminder: Scalars['Boolean'];
  /** What time a child usually gets upon a weekday. */
  wakeUpTime: TimeRange;
}

export interface SleepScheduleInput {
  /** What time a child usually goes to bed during the week. */
  bedTime: TimeRangeInput;
  /** Select either all days or weekends/weekdays. */
  days?: Maybe<Array<DayOfWeek>>;
  /** What time a child usually gets upon a weekday. */
  wakeUpTime: TimeRangeInput;
}

export interface SleepScheduleMutations {
  __typename?: 'SleepScheduleMutations';
  add?: Maybe<SleepSchedulePayload>;
  edit?: Maybe<SleepSchedulePayload>;
  enableReminder?: Maybe<SleepSchedulePayload>;
  remove?: Maybe<RemoveSleepSchedulePayload>;
}


export interface SleepScheduleMutationsAddArgs {
  childId: Scalars['ID'];
  schedule: SleepScheduleInput;
}


export interface SleepScheduleMutationsEditArgs {
  id: Scalars['ID'];
  schedule: SleepScheduleUpdateInput;
}


export interface SleepScheduleMutationsEnableReminderArgs {
  enabled?: Scalars['Boolean'];
  id: Scalars['ID'];
}


export interface SleepScheduleMutationsRemoveArgs {
  id?: Maybe<Scalars['ID']>;
}

export interface SleepSchedulePayload {
  __typename?: 'SleepSchedulePayload';
  id: Scalars['ID'];
  schedule: SleepSchedule;
}

export interface SleepScheduleUpdateInput {
  bedTime?: Maybe<TimeRangeInput>;
  days?: Maybe<Array<DayOfWeek>>;
  wakeUpTime?: Maybe<TimeRangeInput>;
}

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export interface Tag {
  __typename?: 'Tag';
  group: Scalars['String'];
  name: Scalars['String'];
  type: TagTypeEnum;
}

export interface TagMutations {
  __typename?: 'TagMutations';
  disable?: Maybe<EnableTagPayload>;
  enable?: Maybe<EnableTagPayload>;
}


export interface TagMutationsDisableArgs {
  id: Scalars['ID'];
}


export interface TagMutationsEnableArgs {
  id: Scalars['ID'];
}

export enum TagTypeEnum {
  Activity = 'ACTIVITY',
  Behavior = 'BEHAVIOR',
  Feeling = 'FEELING',
  Reaction = 'REACTION',
  Sleep = 'SLEEP',
  Therapy = 'THERAPY'
}

export interface TherapyRecord extends TrackedEvent {
  __typename?: 'TherapyRecord';
  date: Scalars['Date'];
  id: Scalars['ID'];
  notes?: Maybe<Scalars['String']>;
  tags: Array<Tag>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
}

export interface TherapyRecordInput {
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
  tags: Array<Scalars['String']>;
}

export interface TherapyRecordPayload {
  __typename?: 'TherapyRecordPayload';
  id: Scalars['ID'];
  therapy: TherapyRecord;
}


export enum TimeOfDay {
  Afternoon = 'AFTERNOON',
  Evening = 'EVENING',
  Morning = 'MORNING'
}

export interface TimeRange {
  __typename?: 'TimeRange';
  from: Scalars['Time'];
  to: Scalars['Time'];
}

export interface TimeRangeInput {
  from: Scalars['Time'];
  to: Scalars['Time'];
}

export interface TimelineData {
  __typename?: 'TimelineData';
  events: Array<TrackedEvent>;
  from?: Maybe<Scalars['Date']>;
  /**
   * Whether there are some more events after the to date.
   * If no to date is specified, this property will be null.
   */
  hasEventsAfter?: Maybe<Scalars['Boolean']>;
  /**
   * Whether there are some more events before the from date.
   * If no from date is specified, this property will be null.
   */
  hasEventsBefore?: Maybe<Scalars['Boolean']>;
  to?: Maybe<Scalars['Date']>;
}

export interface TrackedEvent {
  date: Scalars['Date'];
  id: Scalars['ID'];
  notes?: Maybe<Scalars['String']>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
}

export interface TrackedEventInfo {
  /** current date by default */
  date?: Maybe<Scalars['Date']>;
  /** Optional notes. */
  notes?: Maybe<Scalars['String']>;
  /** current time of day by default */
  time?: Maybe<TimeOfDay>;
}
