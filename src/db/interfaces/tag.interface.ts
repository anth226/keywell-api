import {TagTypeEnum} from '../../types/schema.types';

export const DefaultTagGroup = 'default';

export interface IProtoTag {
  name: string
  group?: string
  type: TagTypeEnum
  order: number
}

export interface ITag extends IProtoTag {
  id: string
}
