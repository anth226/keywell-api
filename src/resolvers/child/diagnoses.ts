import _ from 'lodash'
import { Child, Diagnosis } from '../../types/schema.types'
import type { ReqContext } from '../../context'

export default async function diagnoses(parent: Child, args: null, ctx: ReqContext): Promise<Diagnosis[]> {
  if (_.isNil(parent.diagnoses) || _.isEmpty(parent.diagnoses)) {
    return []
  }
  const diagnosesIds = parent.diagnoses.map(item => item.id)
  const diagnosis = await ctx.diagnosesLoader.loadMany(diagnosesIds) as Diagnosis[]
  return diagnosis
}
