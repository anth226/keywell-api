import _ from 'lodash'
import arraySort from 'array-sort'
import { Child, Diagnosis } from '../../../types/schema.types'
import type { ReqContext } from '../../../context'

export default async function diagnosesResolver(child: Child, args: null, ctx: ReqContext): Promise<Diagnosis[]> {
  if (_.isNil(child.diagnoses) || _.isEmpty(child.diagnoses)) {
    return []
  }
  const diagnosesIds = child.diagnoses.map(item => item.id)
  const diagnosis = await ctx.diagnosesLoader.loadMany(diagnosesIds) as Diagnosis[]
  return arraySort(diagnosis, 'name')
}
