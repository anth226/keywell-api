import { combineResolvers } from 'graphql-resolvers'
import type {ResolversContext} from '../../context';
import { isAuthenticated } from '../../tools/auth';
import { Medication } from '../../db/models'
import { escapeRegex, initPagination } from '../../utils';
import { Medication as MedicationType, QueryKnownMedicationsArgs } from '../../types/schema.types'

async function knownMedications(parent: null, args: QueryKnownMedicationsArgs, ctx: ResolversContext): Promise<Array<MedicationType>> {
  const { query, pagination } = args
  const { limit, skip } = initPagination(pagination)
  if (!query) {
    return Medication.find({}).limit(limit).skip(skip).sort({
      name: 1
    })
  }

  return Medication.find({
    name: {
      $regex: new RegExp(escapeRegex(query), 'gi')
    }
  }).limit(limit).skip(skip).sort({ name: 1 })
}

export default combineResolvers(
  isAuthenticated,
  knownMedications
) as any