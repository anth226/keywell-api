import DataLoader from 'dataloader'
import _ from 'lodash'
import { Types } from 'mongoose'
import { ChildMedication, IChildMedication } from '../db/models'
import type { ChildMedication as ChildMedicationType } from '../types/schema.types'

const getChildMedication = async (arg: string[]): Promise<ChildMedicationType[][] | Error[] | null> => {
  try {
    const ids = _.uniq(arg)
    const records: IChildMedication[] = await ChildMedication.find({
      child_id: {
        $in: ids.map((id) => Types.ObjectId(id as string))
      },
    })

    return arg.map((id) => records.filter((r) => r.child_id.toString() === id.toString()))
  } catch (error) {
    console.error(error)
    return []
  }
}

export type ChildMedicationLoader = DataLoader<string, ChildMedicationType[]>

export const childMedicationsLoader = (): ChildMedicationLoader => new DataLoader<string, ChildMedicationType[]>(getChildMedication)
