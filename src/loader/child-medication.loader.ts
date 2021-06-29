import DataLoader from 'dataloader'
import _ from 'lodash'
import {ChildMedicationModel} from '../db/models'
import {IChildMedication} from '../db/interfaces/medication.interface';

export type ChildMedicationLoader = DataLoader<string, IChildMedication[]>

export const childMedicationLoader = (): ChildMedicationLoader =>
  new DataLoader<string, IChildMedication[]>(async (arg: string[]): Promise<IChildMedication[][] | Error[] | null> => {
    try {
      const ids = _.uniq(arg)
      const records: IChildMedication[] = await ChildMedicationModel.find({
        child: {
          $in: ids
        },
      })
      return arg.map((id) => records.filter((r) => r.child.toString() === id.toString()))
    } catch (error) {
      console.error(error)
      return []
    }
  })
