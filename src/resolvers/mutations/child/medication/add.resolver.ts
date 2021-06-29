import _, {uniq} from 'lodash'
import {
  ChildMedication,
  ChildMedicationInput,
  ChildMedicationMutationsAddArgs,
  ChildMedicationPayload,
  Medication,
  MedicationInput
} from '../../../../types/schema.types'
import {ReqContext} from '../../../../context'
import {UserInputError} from 'apollo-server-errors'
import {ChildMedicationModel, ChildModel, MedicationModel} from '../../../../db/models'
import {IMedication} from '../../../../db/interfaces/medication.interface';
import {ApolloError} from 'apollo-server'
import {compareTime} from '../../../../utils'

export default async function childMedicationAdd(
  parent: null,
  args: ChildMedicationMutationsAddArgs,
  ctx: ReqContext,
): Promise<ChildMedicationPayload | null> {
  if (!args.childId.trim()) {
    throw new UserInputError('Cannot input empty child')
  }
  const child = await ChildModel.findOne({
    _id: args.childId,
    user: ctx.me.id
  })
  if (_.isNil(child)) {
    throw new UserInputError('Child cannot found')
  }
  checkArgs(args.medication)

  // create new child medication
  const medication = await checkMedication(args.medication.medication, ctx.me.id, args.medication.dose)
  // check if duplicated (child_id, medication_id) of child-medication
  const existOne = await ChildMedicationModel.findOne({child: args.childId, medication: medication.id})
  if (existOne) {
    throw new ApolloError('Medication is duplicate for this child', 'CONFLICT');
  }
  
  const {dose, doseAmount, days = [], sendReminder, takenFrom, takenTo} = _.omitBy(args.medication, _.isNil)
  const record = await ChildMedicationModel.create({
    medication: medication.id,
    child: child.id,
    dose,
    doseAmount,
    days: uniq(days),
    sendReminder,
    scheduleTime: {
      from: takenFrom,
      to: takenTo,
    }
  })

  return {
    id: record.id,
    medication: {
      id: record.id,
      days: record.days,
      dose: record.dose,
      doseAmount: record.doseAmount,
      scheduleTime: {
        from: record.scheduleTime?.from,
        to: record.scheduleTime?.to,
      },
      sendReminder: record.sendReminder,
      medication: {
        id: medication.id
      } as Medication
    } as ChildMedication
  } as ChildMedicationPayload
}


function checkArgs(input: ChildMedicationInput) {
  // by pass if no value provided
  if (_.isNil(input.takenFrom) && _.isNil(input.takenTo)) {
    return
  }
  const {from, to} = compareTime({
    from: input.takenFrom,
    to: input.takenTo
  })
  if (!from || !to) {
    throw new UserInputError('Taken from or Taken to is not a valid time')
  }
}

async function checkMedication(input: MedicationInput, user: string, doze?: string): Promise<IMedication> {
  // prioritize medication
  // if found medication -> return
  if (!_.isNil(input.id) && input.id.trim().length > 0) {
    const medication = await MedicationModel.findOne({
      $and: [
        {
          $or: [
            {
              ...(_.isNil(user) ? {} : {user: user})
            },
            {
              user: {
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
    const existMedication = await MedicationModel.findOne({
      name: {
        $regex: new RegExp(input.name.trim(), 'i')
      }
    })
    if (existMedication) {
      return existMedication
    }
    
    return await MedicationModel.create({
      name: input.name,
      // TODO: should doze is string[] or single string then convert to [doze] as below?
      availableDoses: doze?.length > 0 ? [doze] : [],
      user: user
    })
  }

  throw new UserInputError('Please provide at least a known medication or new medication name')
}
