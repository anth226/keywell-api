import DataLoader from 'dataloader'
import _ from 'lodash'
import {ChildMedicationModel} from '../db/models'
import {IChildMedication} from '../db/interfaces/medication.interface';
import {compareIds} from '../utils';

export type ChildMedicationByIdLoader = DataLoader<string, IChildMedication>

export const childMedicationByIdLoader = (): ChildMedicationByIdLoader =>
  new DataLoader<string, IChildMedication>(async (arg: string[]): Promise<IChildMedication[] | Error[] | null> => {
    try {
      const ids = _.uniq(arg)
      const records: IChildMedication[] = await ChildMedicationModel.find({
        _id: {
          $in: ids
        },
      })
      return arg.map((id) => records.find((r) => compareIds(r.id, id)))
    } catch (error) {
      console.error(error)
      return []
    }
  })
