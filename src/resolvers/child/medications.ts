import _ from 'lodash'
import { Child, ChildMedication as ChildMedicationType } from '../../types/schema.types'
import type { ReqContext } from '../../context'

export default async function medications(parent: Child, args: null, ctx: ReqContext): Promise<ChildMedicationType[]> {
  if (_.isNil(parent.id)) {
    return []
  }
  const result = await ctx.childMedicationsLoader.loadMany([parent.id]) as ChildMedicationType[][]
  const flatted = result.flat()
  return flatted.filter((item: any) => item.child_id.toString() === parent.id.toString())
}
