// Mutations
import register from './resolvers/mutation/register';
import login from './resolvers/mutation/login';
import child from './resolvers/mutation/child'
import childDiagnosis from './resolvers/mutation/childDiagnosis'

// Queries
import knownMedications from './resolvers/query/knownMedications'
import knownDiagnoses from './resolvers/query/knownDiagnoses'
import knownDiagnosis from './resolvers/mutation/knownDiagnosis'
import children from './resolvers/query/children'


export default {
    Query: {
        knownMedications,
        knownDiagnoses,
        children,
    },
    Mutation: {
        register,
        login,
    },
    ChildMutations: child,
    KnownDiagnosesMutations: knownDiagnosis,
    ChildDiagnosisMutations: childDiagnosis,
};
