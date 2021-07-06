import {
  ChildMedicationMutationsTrackArgs,
  MedicationRecord,
  MedicationRecordPayload,
} from '../../../../types/schema.types'
import {ReqContext} from '../../../../context'
import {UserInputError} from 'apollo-server-errors'
import {ChildMedicationModel, ChildModel, MedicationModel, MedicationRecordModel} from '../../../../db/models'
import {compareIds, getCurrentDateFormatted, getTimeOfDay} from '../../../../utils'

export default async function childMedicationTrack(
  parent: null,
  args: ChildMedicationMutationsTrackArgs,
  ctx: ReqContext,
): Promise<MedicationRecordPayload> {
  const {medication} = args;
  const {me} = ctx;
  if (!medication) {
    throw new UserInputError('Cannot input empty medication')
  }

  if(!medication.childMedicationId) {
    throw new UserInputError('Cannot input empty child medication')
  }

  const childMedication = await ChildMedicationModel.findById(medication.childMedicationId)
  if (!childMedication) {
    throw new UserInputError('Incorrect child medication id');
  }

  const child = await ChildModel.findById(childMedication.child);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Incorrect child medication id');
  }

  const record = await MedicationRecordModel.create({
    tracked: new Date(),
    date: medication.info && medication.info.date || getCurrentDateFormatted(),
    time: medication.info && medication.info.time || getTimeOfDay(),
    notes: medication.info && medication.info.notes,
    child: childMedication.child,
    childMedication: childMedication
  });

  return {
    id: record.id,
    medication: {
      id: medication.childMedicationId,
      tracked: record.tracked.toISOString(),
      date: record.date,
      time: record.time,
      notes: record.notes ?? null,
    } as MedicationRecord
  } as MedicationRecordPayload;
}
