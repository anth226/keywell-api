import { combineResolvers } from 'graphql-resolvers'
import type { ReqContext } from '../../context';
import { isAuthenticated } from '../../tools/auth';
import { Diagnosis, QueryKnownDiagnosesArgs } from '../../types/schema.types'
import { initPagination } from '../../utils'
import { diagnosesService } from '../../services'

async function knowDiagnoses(parent: null, args: QueryKnownDiagnosesArgs, ctx: ReqContext): Promise<Array<Diagnosis>> {
  const { query, pagination } = args
  const { me } = ctx
  const { limit, skip } = initPagination(pagination)
  const diagnoses = await diagnosesService.find({
    limit,
    skip,
    name: query,
    user_id: me.id
  })
  return diagnoses
}

export default combineResolvers(
  isAuthenticated,
  knowDiagnoses,
) as any