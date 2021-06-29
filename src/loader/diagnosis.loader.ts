import DataLoader from 'dataloader'
import {DiagnosisModel} from '../db/models'
import {Diagnosis} from '../types/schema.types'
import {IDiagnosis} from '../db/interfaces/diagnosis.interface';

export type DiagnosisLoader = DataLoader<string, Diagnosis>

export const diagnosisLoader = (): DiagnosisLoader => new DataLoader<string, Diagnosis>(
  async (ids: string[]): Promise<Diagnosis[] | Error[] | null> => {
    try {
      const records: IDiagnosis[] = await DiagnosisModel.find({
        _id: {
          $in: ids
        },
      }).sort({name: 1})

      return ids.map((id) => records.find((r) => r.id.toString() === id.toString()))
    } catch (error) {
      console.error(error)
      return []
    }
  })
