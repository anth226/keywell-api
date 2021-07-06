// Scalar
import {dateScalar} from './resolvers/scalars/date.resolver'
import {dateTimeScalar} from './resolvers/scalars/dateTime.resolver'
import {timeScalar} from './resolvers/scalars/time.resolver'
// Mutations
import register from './resolvers/mutations/register.resolver';
import login from './resolvers/mutations/login.resolver';
import childMutations from './resolvers/mutations/child'
import childDiagnosis from './resolvers/mutations/child/diagnosis'
import knownDiagnosis from './resolvers/mutations/knownDiagnosis'
import childMedicationMutations from './resolvers/mutations/child/medication'
import childBehaviorMutations from './resolvers/mutations/child/behavior'
import childActivityMutations from './resolvers/mutations/child/activity'
import childTherapyMutations from './resolvers/mutations/child/therapy'
import childSleepMutations from './resolvers/mutations/child/sleep'
import tagMutations from './resolvers/mutations/tags';
import childSleepScheduleMutations from './resolvers/mutations/child/sleepSchedule';

// Queries
import knownMedications from './resolvers/queries/knownMedications.resolver'
import knownDiagnoses from './resolvers/queries/knownDiagnoses.resolver'
import children from './resolvers/queries/children.resolver'
import childQuery from './resolvers/queries/child.resolver'
import tags from './resolvers/queries/tags.resolver'
import timeline from './resolvers/queries/timeline.resolver'

// Type resolvers
import child from './resolvers/entities/child'
import childMedication from './resolvers/entities/child/medication'
import behaviorRecord from './resolvers/entities/child/behavior'
import activityRecord from './resolvers/entities/child/activity'
import therapyRecord from './resolvers/entities/child/therapy'
import sleepRecord from './resolvers/entities/child/sleep'
import medicationRecord from './resolvers/entities/medication-record.resolver'
import parentReaction from './resolvers/entities/child/behavior/reaction'
import sleepSchedule from './resolvers/entities/sleepSchedule'
import eventResolver from './resolvers/entities/event.resolver'

export default {
  Query: {
    knownMedications,
    knownDiagnoses,
    children,
    child: childQuery,
    tags,
    timeline
  },
  Mutation: {
    register,
    login
  },
  Date: dateScalar,
  DateTime: dateTimeScalar,
  Time: timeScalar,
  ChildMutations: childMutations,
  ChildBehaviorMutations: childBehaviorMutations,
  ChildActivityMutations: childActivityMutations,
  ChildTherapyMutations: childTherapyMutations,
  ChildSleepMutations: childSleepMutations,
  KnownDiagnosesMutations: knownDiagnosis,
  ChildDiagnosisMutations: childDiagnosis,
  Child: child,
  ChildMedicationMutations: childMedicationMutations,
  ChildMedication: childMedication,
  BehaviorRecord: behaviorRecord,
  ActivityRecord: activityRecord,
  TherapyRecord: therapyRecord,
  SleepRecord: sleepRecord,
  MedicationRecord: medicationRecord,
  ParentReaction: parentReaction,
  SleepScheduleMutations: childSleepScheduleMutations,
  SleepSchedule: sleepSchedule,
  TrackedEvent: eventResolver,
  TagMutations: tagMutations
};
