import {ITag} from '../db/interfaces';
import {Tag} from '../types/schema.types';

export function tagToSchemaTag(tag: ITag): Tag {
  return {
    group: tag.group,
    name: tag.name,
    type: tag.type
  } as Tag;
}
