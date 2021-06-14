import _, { uniq } from 'lodash'
import { ChildMedicationMutationsAddArgs, ChildMedicationPayload, MedicationInput, ChildMedicationInput } from '../../../types/schema.types'
import { ReqContext } from '../../../context'
import { UserInputError } from 'apollo-server-errors'
import { Children, ChildMedication, IMedication, Medication } from '../../../db/models'
import dayjs from 'dayjs'

export default async function childMedicationAdd(
  parent: null,
  args: ChildMedicationMutationsAddArgs,
  ctx: ReqContext,
): Promise<ChildMedicationPayload | null> {
  if (!args.childId.trim()) {
    throw new UserInputError('Cannot input empty child')
  }
  const child = await Children.findOne({
    _id: args.childId,
    user_id: ctx.me.id
  })
  if (_.isNil(child)) {
    throw new UserInputError('Child cannot found')
  }
  checkArgs(args.medication)

  // create new child medication
  const medication = await checkMedication(args.medication.medication, ctx.me.id, args.medication.dose)
  const { dose, doseAmount, days = [], sendReminder, takenFrom, takenTo } = args.medication
  const childMedication = await ChildMedication.create({
    medication_id: medication.id,
    child_id: child.id,
    dose,
    doseAmount,
    days: uniq(days),
    sendReminder,
    scheduleTime: {
      from: takenFrom,
      to: takenTo
    }
  })

  return {
    id: childMedication.id,
    medication: childMedication
  }
}

function checkArgs(input: ChildMedicationInput) {
  if (_.isNil(input.takenFrom) && _.isNil(input.takenTo)) {
    return
  }
  const from = dayjs(input.takenFrom)
  if (!from.isValid()) {
    throw new UserInputError('Taken from is not a valid date')
  }
  
  const to = dayjs(input.takenTo)
  if (!to.isValid()) {
    throw new UserInputError('Taken to is not a valid date')
  }
  if (from >= to) {
    throw new UserInputError('Taken from cannot greater than taken to')
  }
}

async function checkMedication(input: MedicationInput, user_id: string, doze?: string): Promise<IMedication> {
  // prioritize medication 
  // if found medication -> return
  if (!_.isNil(input.id) && input.id.trim().length > 0) {
    const medication = await Medication.findOne({
      $and: [
        {
          $or: [
            {
              ...(_.isNil(user_id) ? {} : { user_id } )
            },
            {
              user_id: {
                $exists: false
              }
            },
          ]
        },
        {
          _id: input.id,
        }
      ]
    })
    if (!medication) {
      throw new UserInputError('Cannot found medication')
    }
    
    return medication
  }

  if (!_.isNil(input.name) && input.name.trim().length > 0) {
    const medication = await Medication.create({
      name: input.name,
      // TODO: should doze is string[] or single string then convert to [doze] as below?
      availableDoses: doze?.length > 0 ? [doze] : [],
      user_id
    })
    return medication
  }

  throw new UserInputError('Please provide at least a known medication or new medication name')
}
