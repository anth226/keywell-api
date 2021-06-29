
import {UserInputError} from 'apollo-server';
import type {ReqContext} from '../../../../context';
import {ChildMedicationModel, ChildModel} from '../../../../db/models';
import {ChildMedicationMutationsEnableReminderArgs, ChildMedicationPayload, ChildMedication} from '../../../../types/schema.types';
import {compareIds} from '../../../../utils';

export default async function (parent: null, args: ChildMedicationMutationsEnableReminderArgs, ctx: ReqContext): Promise<ChildMedicationPayload> {
  const {childMedicationId, enabled = true} = args
  if (!childMedicationId || !childMedicationId.trim()) {
    throw new UserInputError('Child medication Id cannot be empty')
  }
  const exist = await ChildMedicationModel.findOne({
    _id: childMedicationId,
  })
  if (!exist) {
    throw new UserInputError('Child medication Id cannot be found')
  }
  const child = await ChildModel.findOne({_id: exist.child})
  if (!child || !compareIds(child.user, ctx.me.id)) {
    throw new UserInputError('Child cannot be found')
  }
  
  const updated = await ChildMedicationModel.findOneAndUpdate({
    _id: childMedicationId
  }, {
    sendReminder: enabled
  }, {
    new: true
  })

  const {id, sendReminder, days, dose, doseAmount} = updated
  return {
    id: childMedicationId,
    medication: {
      id,
      sendReminder,
      days,
      dose,
      doseAmount,
      scheduleTime: {
        from: updated.scheduleTime?.from,
        to: updated.scheduleTime?.to,
      },
      // add medication id here for resolver
      medication: {
        id: updated.medication
      }
    } as unknown as ChildMedication,
  }
}