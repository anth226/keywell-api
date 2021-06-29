import _ from 'lodash'
import type {ReqContext} from '../../../context'
import {IChildMedication} from '../../../db/interfaces/medication.interface';

export default async function medicationsResolver(parent: { id: string }, args: null, ctx: ReqContext): Promise<IChildMedication[]> {
  if (_.isNil(parent.id)) {
    return []
  }
  const result = await ctx.childMedicationsLoader.load(parent.id) as IChildMedication[]
  const medications = result.filter((item: any) => item.child.toString() === parent.id.toString())
  return medications
}
