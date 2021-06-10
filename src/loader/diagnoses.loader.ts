import DataLoader from 'dataloader'
import _ from 'lodash'
import { Types } from 'mongoose'
import { Diagnoses, IDiagnosis } from '../db/models'
import { Diagnosis } from '../types/schema.types'

const getDiagnoses = async (arg: string[]): Promise<Diagnosis[] | Error[] | null> => {
  try {
    const ids = _.uniq(arg)
    const records: IDiagnosis[] = await Diagnoses.find({
      _id: {
        $in: ids.map((id) => Types.ObjectId(id as string))
      },
    })

    return arg.map((id) => records.find((r) => r.id.toString() === id.toString()))
  } catch (error) {
    console.error(error)
    return []
  }
}

export type DiagnosisLoader = DataLoader<string, Diagnosis>

export const diagnosisLoader = (): DiagnosisLoader => new DataLoader<string, Diagnosis>(getDiagnoses)
