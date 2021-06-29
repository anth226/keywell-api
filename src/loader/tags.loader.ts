import DataLoader from 'dataloader'
import {tagsService} from '../services';
import {ITag} from '../db/interfaces/tag.interface';

export type TagsLoader = DataLoader<string, string>

export const TAGS_LOADER_SEPARATOR = ','

// Seems DataLoader doesn't support arrays of arrays as the input and output params,
// so using serialized arrays of ids into strings as an input,
// and a JSON-serialized array of tag objects as an output.

export const tagsLoader = (): TagsLoader => new DataLoader<string, string>(
  async (serializedIds: string[]): Promise<string[] | Error[] | null> => {
    try {
      const map = new Map<string, ITag>();
      const arrOfIdArrays = serializedIds.map(arr => arr.split(TAGS_LOADER_SEPARATOR));
      const flattenedIds = arrOfIdArrays.flat();
      (await tagsService.findTagsByIds(flattenedIds)).reduce((map, tag) => {
        map[tag.id] = tag.id
        return map;
      }, map);
      return arrOfIdArrays.map(arr => JSON.stringify(arr.map(id => map[id])))
    } catch (error) {
      console.error(error)
      return []
    }
  })
