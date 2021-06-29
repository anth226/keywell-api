import {TagModel} from '../db/models';
import {TagTypeEnum} from '../types/schema.types';
import {UserInputError} from 'apollo-server';
import {IUser} from '../db/interfaces/user.interface';
import {ITag} from '../db/interfaces/tag.interface';
import {ObjectId} from 'mongoose';

const DEFAULT_ORDER = {
  group: 1,
  order: 1,
  name: 1,
};

class TagsService {

  async findAllTags(type: TagTypeEnum, user?: IUser): Promise<ITag[]> {
    const disabledTags = user ? user.disabled_tags : [];
    return TagModel.find({
      type: type,
      _id: {$nin: disabledTags},
    }).sort(DEFAULT_ORDER);
  }

  async findTagsInGroup(type: TagTypeEnum, group: string, user?: IUser): Promise<ITag[]> {
    const disabledTags = user ? user.disabled_tags : [];
    return TagModel.find({
      type,
      group,
      _id: {$nin: disabledTags},
    }).sort(DEFAULT_ORDER);
  }

  /**
   * @throws UserInputError In case when any of that specified tag either doesn't exist or disabled for the given user.
   */
  async findTags(type: TagTypeEnum, tags: string[], user?: IUser): Promise<ITag[]> {
    const disabledTags = user ? user.disabled_tags : [];
    const docs = await TagModel.find({
      name: {$in: tags},
      type: type,
      _id: {$nin: disabledTags},
    }).sort(DEFAULT_ORDER);
    if (docs.length !== tags.length) {
      throw new UserInputError(`Invalid or disabled ${type.toLowerCase()} tags`);
    }
    return docs;
  }

  /**
   * @throws UserInputError In case when any of that specified tag either doesn't exist or disabled for the given user.
   */
  async findTagByName(type: TagTypeEnum, name: string, user?: IUser): Promise<ITag> {
    const tags = await this.findTags(type, [name], user);
    return tags[0];
  }

  /**
   * NOTE: this method doesn't check for any disabled tags for the user.
   * It just returns all tags with the give ids.
   */
  async findTagsByIds(ids: string[] | ObjectId[]): Promise<ITag[]> {
    return TagModel.find({_id: {$in: ids}}).sort(DEFAULT_ORDER);
  }
}

export const tagsService = new TagsService()
