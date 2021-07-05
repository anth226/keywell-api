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
import disableTag from './resolvers/mutations/tags/disableTag.resolver';
import enableTag from './resolvers/mutations/tags/enableTag.resolver';
import childSleepScheduleMutations from './resolvers/mutations/child/sleepSchedule';

// Queries
import knownMedications from './resolvers/queries/knownMedications.resolver'
import knownDiagnoses from './resolvers/queries/knownDiagnoses.resolver'
import children from './resolvers/queries/children.resolver'
import childQuery from './resolvers/queries/child.resolver'
import tags from './resolvers/queries/tags.resolver'

// Type resolvers
import child from './resolvers/entities/child'
import childMedication from './resolvers/entities/child/medication'
import behaviorRecord from './resolvers/entities/child/behavior'
import activityRecord from './resolvers/entities/child/activity'
import parentReaction from './resolvers/entities/child/behavior/reaction'
import sleepSchedule from './resolvers/entities/sleepSchedule'

export default {
  Query: {
    knownMedications,
    knownDiagnoses,
    children,
    child: childQuery,
    tags,
  },
  Mutation: {
    register,
    login,
    disableTag,
    enableTag,
  },
  Date: dateScalar,
  DateTime: dateTimeScalar,
  Time: timeScalar,
  ChildMutations: childMutations,
  ChildBehaviorMutations: childBehaviorMutations,
  ChildActivityMutations: childActivityMutations,
  ChildTherapyMutations: childTherapyMutations,
  KnownDiagnosesMutations: knownDiagnosis,
  ChildDiagnosisMutations: childDiagnosis,
  Child: child,
  ChildMedicationMutations: childMedicationMutations,
  ChildMedication: childMedication,
  BehaviorRecord: behaviorRecord,
  ActivityRecord: activityRecord,
  ParentReaction: parentReaction,
  SleepScheduleMutations: childSleepScheduleMutations,
  SleepSchedule: sleepSchedule,
};
