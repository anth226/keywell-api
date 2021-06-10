export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
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
};

export type ActivityRecord = TrackedEvent & {
  __typename?: 'ActivityRecord';
  id: Scalars['ID'];
  tag: ActivityTag;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
};

export type ActivityRecordInput = {
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
  tag: Scalars['String'];
};

export type ActivityRecordPayload = {
  __typename?: 'ActivityRecordPayload';
  activity: ActivityRecord;
  id: Scalars['ID'];
};

export type ActivityTag = Tag & {
  __typename?: 'ActivityTag';
  /**
   * Unlike behavior tag, allow arbitrary name here,
   * name may change, activity groups may be added later.
   */
  group: Scalars['String'];
  name: Scalars['String'];
};

export type ActivityTagMutations = {
  __typename?: 'ActivityTagMutations';
  disable?: Maybe<EnableActivityTagPayload>;
  enable?: Maybe<EnableActivityTagPayload>;
};


export type ActivityTagMutationsDisableArgs = {
  tag: Scalars['String'];
};


export type ActivityTagMutationsEnableArgs = {
  tag: Scalars['String'];
};

export type AddChildDiagnosisPayload = {
  __typename?: 'AddChildDiagnosisPayload';
  added: Scalars['Boolean'];
  id: Scalars['ID'];
};

export enum BehaviorGroup {
  Desirable = 'DESIRABLE',
  Undesirable = 'UNDESIRABLE'
}

export type BehaviorProgress = {
  __typename?: 'BehaviorProgress';
  group: BehaviorGroup;
  /** 0-100, can be negative or positive. */
  percentage?: Maybe<Scalars['Int']>;
  /** 0.. infinity. */
  streakDays?: Maybe<Scalars['Int']>;
  /** You've reached this milestone XX times before.. (applies to streakDays only) */
  streakDaysTimesReachedBefore?: Maybe<Scalars['Int']>;
};

export type BehaviorRecord = TrackedEvent & {
  __typename?: 'BehaviorRecord';
  id: Scalars['ID'];
  reaction?: Maybe<ParentReaction>;
  tag: BehaviorTag;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
};

export type BehaviorRecordInput = {
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
  /** taken from BehaviorTag.name */
  tag: Scalars['String'];
};

export type BehaviorRecordPayload = {
  __typename?: 'BehaviorRecordPayload';
  behavior: BehaviorRecord;
  id: Scalars['ID'];
};

/** behavior tags have group */
export type BehaviorTag = Tag & {
  __typename?: 'BehaviorTag';
  group: BehaviorGroup;
  name: Scalars['String'];
};

export type BehaviorTagMutations = {
  __typename?: 'BehaviorTagMutations';
  disable?: Maybe<EnableBehaviorTagPayload>;
  enable?: Maybe<EnableBehaviorTagPayload>;
};


export type BehaviorTagMutationsDisableArgs = {
  tag: Scalars['String'];
};


export type BehaviorTagMutationsEnableArgs = {
  tag: Scalars['String'];
};

export type Child = {
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
};

export type ChildActivityMutations = {
  __typename?: 'ChildActivityMutations';
  delete?: Maybe<DeleteActivityRecordPayload>;
  edit?: Maybe<ActivityRecordPayload>;
  track?: Maybe<ActivityRecordPayload>;
};


export type ChildActivityMutationsDeleteArgs = {
  id: Scalars['ID'];
};


export type ChildActivityMutationsEditArgs = {
  activity: ActivityRecordInput;
  id: Scalars['ID'];
};


export type ChildActivityMutationsTrackArgs = {
  activity: ActivityRecordInput;
};

export type ChildBehaviorMutations = {
  __typename?: 'ChildBehaviorMutations';
  delete?: Maybe<DeleteBehaviorRecordPayload>;
  edit?: Maybe<BehaviorRecordPayload>;
  track?: Maybe<BehaviorRecordPayload>;
  trackReaction?: Maybe<ParentReactionPayload>;
};


export type ChildBehaviorMutationsDeleteArgs = {
  id: Scalars['ID'];
};


export type ChildBehaviorMutationsEditArgs = {
  behavior: BehaviorRecordInput;
  id: Scalars['ID'];
};


export type ChildBehaviorMutationsTrackArgs = {
  behavior: BehaviorRecordInput;
};


export type ChildBehaviorMutationsTrackReactionArgs = {
  reaction: ParentReactionInput;
  trackedBehaviorId: Scalars['ID'];
};

export type ChildDiagnosisMutations = {
  __typename?: 'ChildDiagnosisMutations';
  add?: Maybe<AddChildDiagnosisPayload>;
  remove?: Maybe<RemoveChildDiagnosisPayload>;
};


export type ChildDiagnosisMutationsAddArgs = {
  childId: Scalars['ID'];
  diagnosisId: Scalars['ID'];
};


export type ChildDiagnosisMutationsRemoveArgs = {
  childId: Scalars['ID'];
  diagnosisId: Scalars['ID'];
};

export type ChildInput = {
  age: Scalars['Int'];
  name: Scalars['String'];
};

export type ChildMedication = {
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
};

export type ChildMedicationInput = {
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
  medication?: Maybe<MedicationInput>;
  /** When is this taken? */
  takenFrom?: Maybe<Scalars['Time']>;
  takenTo?: Maybe<Scalars['Time']>;
};

export type ChildMedicationMutations = {
  __typename?: 'ChildMedicationMutations';
  add?: Maybe<ChildMedicationPayload>;
  deleteRecord?: Maybe<DeleteMedicationRecordPayload>;
  edit?: Maybe<ChildMedicationPayload>;
  editRecord?: Maybe<MedicationRecordPayload>;
  enableReminder?: Maybe<ChildMedicationPayload>;
  remove?: Maybe<RemoveChildMedicationPayload>;
  track?: Maybe<MedicationRecordPayload>;
};


export type ChildMedicationMutationsAddArgs = {
  childId: Scalars['ID'];
  medication?: Maybe<ChildMedicationInput>;
};


export type ChildMedicationMutationsDeleteRecordArgs = {
  medicationRecordId: Scalars['ID'];
};


export type ChildMedicationMutationsEditArgs = {
  childMedicationId: Scalars['ID'];
  medication?: Maybe<ChildMedicationInput>;
};


export type ChildMedicationMutationsEditRecordArgs = {
  medication: MedicationRecordInput;
  medicationRecordId: Scalars['ID'];
};


export type ChildMedicationMutationsEnableReminderArgs = {
  childMedicationId: Scalars['ID'];
  enabled?: Scalars['Boolean'];
};


export type ChildMedicationMutationsRemoveArgs = {
  childMedicationId: Scalars['ID'];
};


export type ChildMedicationMutationsTrackArgs = {
  medication: MedicationRecordInput;
};

export type ChildMedicationPayload = {
  __typename?: 'ChildMedicationPayload';
  id: Scalars['ID'];
  medication: ChildMedication;
};

export type ChildMutations = {
  __typename?: 'ChildMutations';
  activity?: Maybe<ChildActivityMutations>;
  add?: Maybe<ChildProfilePayload>;
  behavior?: Maybe<ChildBehaviorMutations>;
  delete?: Maybe<DeleteChildPayload>;
  diagnosis?: Maybe<ChildDiagnosisMutations>;
  edit?: Maybe<ChildProfilePayload>;
  medication?: Maybe<ChildMedicationMutations>;
  sleep?: Maybe<ChildSleepMutations>;
  therapy?: Maybe<ChildTherapyMutations>;
};


export type ChildMutationsAddArgs = {
  input: ChildInput;
};


export type ChildMutationsDeleteArgs = {
  id: Scalars['ID'];
};


export type ChildMutationsEditArgs = {
  id: Scalars['ID'];
  input: ChildInput;
};

export type ChildProfile = {
  __typename?: 'ChildProfile';
  age?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type ChildProfilePayload = {
  __typename?: 'ChildProfilePayload';
  child: ChildProfile;
  id: Scalars['ID'];
};

export type ChildSleepMutations = {
  __typename?: 'ChildSleepMutations';
  deleteRecord?: Maybe<DeleteSleepRecordPayload>;
  editRecord?: Maybe<SleepRecordPayload>;
  schedule?: Maybe<SleepScheduleMutations>;
  track?: Maybe<SleepRecordPayload>;
};


export type ChildSleepMutationsDeleteRecordArgs = {
  id: Scalars['ID'];
};


export type ChildSleepMutationsEditRecordArgs = {
  id: Scalars['ID'];
  sleep: SleepRecordInput;
};


export type ChildSleepMutationsTrackArgs = {
  sleep: SleepRecordInput;
};

export type ChildTherapyMutations = {
  __typename?: 'ChildTherapyMutations';
  delete?: Maybe<DeleteTherapyRecordPayload>;
  edit?: Maybe<TherapyRecordPayload>;
  track?: Maybe<TherapyRecordPayload>;
};


export type ChildTherapyMutationsDeleteArgs = {
  id: Scalars['ID'];
};


export type ChildTherapyMutationsEditArgs = {
  id: Scalars['ID'];
  therapy: TherapyRecordInput;
};


export type ChildTherapyMutationsTrackArgs = {
  therapy: TherapyRecordInput;
};

export type ChildrenSortInput = {
  createdAt?: Maybe<SortDirection>;
};

export type CorePagination = {
  limit?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};

export type DailyInsights = {
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
};



export enum DayOfWeek {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

export type DeleteActivityRecordPayload = {
  __typename?: 'DeleteActivityRecordPayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
};

export type DeleteBehaviorRecordPayload = {
  __typename?: 'DeleteBehaviorRecordPayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
};

export type DeleteChildPayload = {
  __typename?: 'DeleteChildPayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
};

export type DeleteMedicationRecordPayload = {
  __typename?: 'DeleteMedicationRecordPayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
};

export type DeleteSleepRecordPayload = {
  __typename?: 'DeleteSleepRecordPayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
};

export type DeleteTherapyRecordPayload = {
  __typename?: 'DeleteTherapyRecordPayload';
  deleted: Scalars['Boolean'];
  /** Deleted record ID. */
  id: Scalars['ID'];
};

export type Diagnosis = {
  __typename?: 'Diagnosis';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type DiagnosisMutationPayload = {
  __typename?: 'DiagnosisMutationPayload';
  diagnosis: Diagnosis;
  id: Scalars['ID'];
};

export type EnableActivityTagPayload = {
  __typename?: 'EnableActivityTagPayload';
  enabled: Scalars['Boolean'];
  tag: Scalars['String'];
};

export type EnableBehaviorTagPayload = {
  __typename?: 'EnableBehaviorTagPayload';
  enabled: Scalars['Boolean'];
  tag: Scalars['String'];
};

export type EnableSleepTagPayload = {
  __typename?: 'EnableSleepTagPayload';
  enabled: Scalars['Boolean'];
  tag: Scalars['String'];
};

export type EnableTherapyTagPayload = {
  __typename?: 'EnableTherapyTagPayload';
  enabled: Scalars['Boolean'];
  tag: Scalars['String'];
};

export type KnownDiagnosesMutations = {
  __typename?: 'KnownDiagnosesMutations';
  add?: Maybe<DiagnosisMutationPayload>;
};


export type KnownDiagnosesMutationsAddArgs = {
  name: Scalars['String'];
};

export type Medication = {
  __typename?: 'Medication';
  /** Only filled if known. */
  availableDoses?: Maybe<Array<Scalars['String']>>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type MedicationInput = {
  /** Only if medication is already known. */
  id?: Maybe<Scalars['ID']>;
  /** Add new unknown (yet) medication. */
  name?: Maybe<Scalars['String']>;
};

export type MedicationRecord = TrackedEvent & {
  __typename?: 'MedicationRecord';
  id: Scalars['ID'];
  medication?: Maybe<ChildMedication>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
};

export type MedicationRecordInput = {
  childMedicationId: Scalars['ID'];
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
};

export type MedicationRecordPayload = {
  __typename?: 'MedicationRecordPayload';
  id: Scalars['ID'];
  medication: MedicationRecord;
};

export type Mutation = {
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
};


export type MutationAddFcmTokenArgs = {
  token: Scalars['String'];
};


export type MutationLoginArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationRegisterArgs = {
  email: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
};

export type ParentReaction = {
  __typename?: 'ParentReaction';
  feeling?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  tags: Array<Scalars['String']>;
};

export type ParentReactionInput = {
  /** taken from parentReactionFeelings */
  feeling?: Maybe<Scalars['String']>;
  /** taken from parentReacitons.tag */
  tags: Array<Scalars['String']>;
};

export type ParentReactionPayload = {
  __typename?: 'ParentReactionPayload';
  id: Scalars['ID'];
  reaction: ParentReaction;
};

export type Profile = {
  __typename?: 'Profile';
  email: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type ProfilePayload = {
  __typename?: 'ProfilePayload';
  id: Scalars['ID'];
  profile: Profile;
};

export type Query = {
  __typename?: 'Query';
  /** All enabled activity tags. */
  activityTags: Array<Tag>;
  /**
   * Calculate behavior progress, based on the given params.
   * Before and after here means the period start dates.
   * Days will be added to the period start to define period end.
   */
  behaviorProgress?: Maybe<BehaviorProgress>;
  /** All enabled behavior tags, optionally filtered by group. */
  behaviorTags: Array<BehaviorTag>;
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
  /** All available feelings (calm/happy/proud/sad etc). */
  parentReactionFeelings: Array<Scalars['String']>;
  /** All enabled reaction tags. */
  parentReactionTags: Array<Tag>;
  /** All enabled sleep tags. */
  sleepTags: Array<Tag>;
  /** All enabled therapy tags. */
  therapyTags: Array<Tag>;
  /**
   * All events ordered by date and time.
   * Date filter - both dates should be included into the result.
   * Means that events that happened on date "from" should be included,
   * as well as the events that happened on date "to" (if specified).
   * Both dates can be null, no date filter should be applied in this case.
   * Another extreme case is when both "date" equals to to "date",
   * which means to return only events for that date.
   */
  timeline: Array<TrackedEvent>;
};


export type QueryBehaviorProgressArgs = {
  after: Scalars['Date'];
  before: Scalars['Date'];
  calculatePercentage?: Maybe<Scalars['Boolean']>;
  calculateStreakDays?: Maybe<Scalars['Boolean']>;
  calculateStreakDaysTimesBefore?: Maybe<Scalars['Boolean']>;
  days: Scalars['Int'];
  group: BehaviorGroup;
};


export type QueryBehaviorTagsArgs = {
  group?: Maybe<BehaviorGroup>;
};


export type QueryChildArgs = {
  id: Scalars['ID'];
};


export type QueryChildrenArgs = {
  sortBy?: Maybe<ChildrenSortInput>;
};


export type QueryInsightsArgs = {
  from?: Maybe<Scalars['Date']>;
  group?: Maybe<BehaviorGroup>;
  to?: Maybe<Scalars['Date']>;
};


export type QueryKnownDiagnosesArgs = {
  pagination?: Maybe<CorePagination>;
  query?: Maybe<Scalars['String']>;
};


export type QueryKnownMedicationsArgs = {
  pagination?: Maybe<CorePagination>;
  query?: Maybe<Scalars['String']>;
};


export type QueryTimelineArgs = {
  from?: Maybe<Scalars['Date']>;
  to?: Maybe<Scalars['Date']>;
};

export type RemoveChildDiagnosisPayload = {
  __typename?: 'RemoveChildDiagnosisPayload';
  id: Scalars['ID'];
  removed: Scalars['Boolean'];
};

export type RemoveChildMedicationPayload = {
  __typename?: 'RemoveChildMedicationPayload';
  /** Deleted record ID. */
  id: Scalars['ID'];
  removed: Scalars['Boolean'];
};

export type RemoveSleepSchedulePayload = {
  __typename?: 'RemoveSleepSchedulePayload';
  /** Deleted record ID. */
  id: Scalars['ID'];
  removed: Scalars['Boolean'];
};

export type SleepRecord = TrackedEvent & {
  __typename?: 'SleepRecord';
  bedTime: Scalars['Time'];
  id: Scalars['ID'];
  incidents?: Maybe<Array<Scalars['String']>>;
  notes?: Maybe<Scalars['String']>;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
  wakeUpTime: Scalars['Time'];
};

export type SleepRecordInput = {
  bedTime: Scalars['Time'];
  /** use current date if omitted */
  date?: Maybe<Scalars['Date']>;
  incidents?: Maybe<Array<Scalars['String']>>;
  notes?: Maybe<Scalars['String']>;
  wakeUpTime: Scalars['Time'];
};

export type SleepRecordPayload = {
  __typename?: 'SleepRecordPayload';
  id: Scalars['ID'];
  sleep: SleepRecord;
};

export type SleepSchedule = {
  __typename?: 'SleepSchedule';
  /** What time a child usually goes to bed during the week. */
  bedTime: TimeRange;
  /** Either all days or weekends/weekdays. */
  days?: Maybe<Array<DayOfWeek>>;
  id: Scalars['ID'];
  sendReminder: Scalars['Boolean'];
  /** What time a child usually gets upon a weekday. */
  wakeUpTime: TimeRange;
};

export type SleepScheduleInput = {
  /** What time a child usually goes to bed during the week. */
  bedTime: TimeRangeInput;
  /** Select either all days or weekends/weekdays. */
  days?: Maybe<Array<DayOfWeek>>;
  /** What time a child usually gets upon a weekday. */
  wakeUpTime: TimeRangeInput;
};

export type SleepScheduleMutations = {
  __typename?: 'SleepScheduleMutations';
  add?: Maybe<SleepSchedulePayload>;
  edit?: Maybe<SleepSchedulePayload>;
  enableReminder?: Maybe<SleepSchedulePayload>;
  remove?: Maybe<RemoveSleepSchedulePayload>;
};


export type SleepScheduleMutationsAddArgs = {
  childId?: Maybe<Scalars['ID']>;
  schedule?: Maybe<SleepScheduleInput>;
};


export type SleepScheduleMutationsEditArgs = {
  id?: Maybe<Scalars['ID']>;
  schedule?: Maybe<SleepScheduleInput>;
};


export type SleepScheduleMutationsEnableReminderArgs = {
  enabled?: Scalars['Boolean'];
  id: Scalars['ID'];
};


export type SleepScheduleMutationsRemoveArgs = {
  id?: Maybe<Scalars['ID']>;
};

export type SleepSchedulePayload = {
  __typename?: 'SleepSchedulePayload';
  id: Scalars['ID'];
  schedule: SleepSchedule;
};

export type SleepTagMutations = {
  __typename?: 'SleepTagMutations';
  enable?: Maybe<EnableSleepTagPayload>;
};


export type SleepTagMutationsEnableArgs = {
  enabled?: Scalars['Boolean'];
  tag: Scalars['String'];
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Tag = {
  name: Scalars['String'];
};

export type TagMutations = {
  __typename?: 'TagMutations';
  activity?: Maybe<ActivityTagMutations>;
  behavior?: Maybe<BehaviorTagMutations>;
  sleep?: Maybe<SleepTagMutations>;
  therapy?: Maybe<TherapyTagMutations>;
};

/** Activity, therapy, sleep tags. */
export type TagType = Tag & {
  __typename?: 'TagType';
  name: Scalars['String'];
};

export type TherapyRecord = TrackedEvent & {
  __typename?: 'TherapyRecord';
  id: Scalars['ID'];
  tag: Tag;
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
};

export type TherapyRecordInput = {
  /** Use defaults if omitted */
  info?: Maybe<TrackedEventInfo>;
  tag: Scalars['String'];
};

export type TherapyRecordPayload = {
  __typename?: 'TherapyRecordPayload';
  id: Scalars['ID'];
  therapy: TherapyRecord;
};

export type TherapyTagMutations = {
  __typename?: 'TherapyTagMutations';
  disable?: Maybe<EnableTherapyTagPayload>;
  enable?: Maybe<EnableTherapyTagPayload>;
};


export type TherapyTagMutationsDisableArgs = {
  tag: Scalars['String'];
};


export type TherapyTagMutationsEnableArgs = {
  tag: Scalars['String'];
};


export enum TimeOfDay {
  Afternoon = 'AFTERNOON',
  Evening = 'EVENING',
  Morning = 'MORNING'
}

export type TimeRange = {
  __typename?: 'TimeRange';
  from: Scalars['Time'];
  to: Scalars['Time'];
};

export type TimeRangeInput = {
  from: Scalars['Time'];
  to: Scalars['Time'];
};

export type TrackedEvent = {
  id: Scalars['ID'];
  time: TimeOfDay;
  tracked: Scalars['DateTime'];
};

export type TrackedEventInfo = {
  /** current date by default */
  date?: Maybe<Scalars['Date']>;
  /** current time of day by default */
  time?: Maybe<TimeOfDay>;
};
