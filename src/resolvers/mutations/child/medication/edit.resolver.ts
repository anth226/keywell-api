import _, {uniq} from 'lodash'
import {
  ChildMedication,
  ChildMedicationUpdateInput,
  ChildMedicationMutationsEditArgs,
  ChildMedicationPayload,
  Medication,
  MedicationInput,
} from '../../../../types/schema.types'
import {ReqContext} from '../../../../context'
import {UserInputError} from 'apollo-server-errors'
import {ChildMedicationModel, ChildModel, MedicationModel} from '../../../../db/models'
import {compareIds, compareTime} from '../../../../utils'
import {IChildMedication, IMedication} from '../../../../db/interfaces/medication.interface'

export default async function childMedicationEdit(
  parent: null,
  args: ChildMedicationMutationsEditArgs,
  ctx: ReqContext,
): Promise<ChildMedicationPayload | null> {
  const {childMedicationId, medication: medicationArg} = args
  if (!childMedicationId.trim()) {
    throw new UserInputError('Cannot input empty childMedicationId')
  }
  // check if ChildMedication exist
  const exist = await ChildMedicationModel.findOne({
    _id: childMedicationId,
  })
  if (!exist) {
    throw new UserInputError('Child medication Id cannot be found')
  }
  // check if Child belong to
  const child = await ChildModel.findOne({_id: exist.child})
  if (!child || !compareIds(child.user, ctx.me.id)) {
    throw new UserInputError('Child cannot be found')
  }

  checkArgs(medicationArg)

  // set current medication_id of ChildMedication is from existing value
  let medicationId = exist.medication
  // check if need to update medication
  const medication = await checkMedicationArg(medicationArg.medication, ctx.me.id)
  // if medication == null -> ignore medication check, use existing medication id
  // if medication != null -> client send MedicationInput update -> find / create new Medication
  if (medication) {
    // assign new medicationId to current ChildMedication
    medicationId = medication.id
  }

  const updateObj = getUpdateObj(medicationArg, exist)
  
  const record = await ChildMedicationModel.findOneAndUpdate(
    {
      _id: childMedicationId,
    },
    {
      medication: medicationId,
      child: child.id,
      ...updateObj,
    },
    {
      new: true,
      omitUndefined: true,
    },
  )

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
        id: medicationId,
      } as Medication,
    } as ChildMedication,
  } as ChildMedicationPayload
}

function checkArgs(input: ChildMedicationUpdateInput) {
  // by pass if no value provided
  if (_.isNil(input.takenFrom) && _.isNil(input.takenTo)) {
    return
  }
  const {from, to} = compareTime({
    from: input.takenFrom,
    to: input.takenTo,
  })
  if (!from || !to) {
    throw new UserInputError('Taken from or Taken to is not a valid time')
  }
}

async function checkMedicationArg(input: MedicationInput, user: string): Promise<IMedication | null> {
  // if found medication -> return
  if (!_.isNil(input?.id) && input.id.trim().length > 0) {
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

  if (!_.isNil(input?.name) && input.name.trim().length > 0) {
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
      user: user
    })
  }

  return null
}

function getUpdateObj(input: ChildMedicationUpdateInput, exist: IChildMedication): Record<string, any>{
  const {
    medication: _medication, // exclude this
    days,
    takenFrom,
    takenTo,
    ...updateObj
  } = _.omitBy(input, _.isNil)
  let scheduleTime = {
    from: exist.scheduleTime?.from,
    to: exist.scheduleTime?.to,
  }
  if (!_.isNil(takenFrom) && !_.isNil(takenTo)) {
    scheduleTime = {
      from: takenFrom,
      to: takenTo,
    }
  }
  updateObj.scheduleTime = scheduleTime
  if (!_.isNil(days)) {
    updateObj.days = _.uniq(days)
  }

  return updateObj
}
