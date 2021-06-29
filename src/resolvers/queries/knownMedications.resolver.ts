import {combineResolvers} from 'graphql-resolvers'
import type {ResolversContext} from '../../context';
import {isAuthenticated} from '../../tools/auth';
import {initPagination} from '../../utils';
import {Medication as MedicationType, QueryKnownMedicationsArgs} from '../../types/schema.types'
import {medicationService} from '../../services';

async function knownMedications(parent: null, args: QueryKnownMedicationsArgs, ctx: ResolversContext): Promise<Array<MedicationType>> {
  const {query, pagination} = args
  const {limit, skip} = initPagination(pagination)
  const medications = await medicationService.find({
    limit,
    skip,
    name: query,
    user: ctx.me.id
  })

  return medications
}

export default combineResolvers(
  isAuthenticated,
  knownMedications
) as any
