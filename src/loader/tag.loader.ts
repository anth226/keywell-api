import DataLoader from 'dataloader'
import {ITag} from '../db/interfaces/tag.interface';
import {tagsService} from '../services';

export type TagLoader = DataLoader<string, ITag>

export const tagLoader = (): TagLoader => new DataLoader<string, ITag>(
  async (ids: string[] | any): Promise<ITag[] | Error[] | null> => {
    try {
      const records: ITag[] = await tagsService.findTagsByIds(ids);
      return ids.map((id) => records.find((r) => r.id.toString() === id.toString()))
    } catch (error) {
      console.error(error)
      return []
    }
  })
