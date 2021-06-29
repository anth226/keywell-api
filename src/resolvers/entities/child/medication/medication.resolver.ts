import _ from 'lodash'
import {isValidObjectId} from 'mongoose'
import {ReqContext} from '../../../../context'
import {IMedication} from '../../../../db/interfaces/medication.interface';

export default async function medicationResolver(
  parent: any,
  args: null,
  ctx: ReqContext): Promise<IMedication> {
  if (!parent.medication) {
    return
  }
  if (!_.isNil(parent.medication) && isValidObjectId(parent.medication)) {
    return ctx.medicationLoader.load(parent.medication)
  }
  if (!_.isNil(parent.medication?.id) && isValidObjectId(parent.medication.id)) {
    return ctx.medicationLoader.load(parent.medication.id)
  }

  return null
}
