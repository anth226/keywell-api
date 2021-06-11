// Mutations
import register from './resolvers/mutation/register';
import login from './resolvers/mutation/login';
import childMutations from './resolvers/mutation/child'
import childDiagnosis from './resolvers/mutation/childDiagnosis'
import knownDiagnosis from './resolvers/mutation/knownDiagnosis'
import childBehaviorMutations from './resolvers/mutation/child/behavior'

// Queries
import knownMedications from './resolvers/query/knownMedications'
import knownDiagnoses from './resolvers/query/knownDiagnoses'
import children from './resolvers/query/children'
import childQuery from './resolvers/query/child'
import behaviorTags from './resolvers/query/behaviorTags'

// Type resolvers
import child from './resolvers/child'

export default {
    Query: {
        knownMedications,
        knownDiagnoses,
        children,
        child: childQuery,
        behaviorTags
    },
    Mutation: {
        register,
        login,
    },
    ChildMutations: childMutations,
    ChildBehaviorMutations: childBehaviorMutations,
    KnownDiagnosesMutations: knownDiagnosis,
    ChildDiagnosisMutations: childDiagnosis,
    Child: child,
};
