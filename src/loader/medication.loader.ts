import DataLoader from 'dataloader'
import {MedicationModel} from '../db/models'
import {IMedication} from '../db/interfaces/medication.interface';

export type MedicationLoader = DataLoader<string, IMedication>

export const medicationLoader = (): MedicationLoader => new DataLoader<string, IMedication>(
  async (ids: string[] | any): Promise<IMedication[] | Error[] | null> => {
    try {
      const records: IMedication[] = await MedicationModel.find({
        _id: {
          $in: ids
        },
      })
      return ids.map((id) => records.find((r) => r.id.toString() === id.toString()))
    } catch (error) {
      console.error(error)
      return []
    }
  })
