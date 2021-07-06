import {TagModel, UserModel} from '../db/models';
import {TagTypeEnum} from '../types/schema.types';
import {UserInputError} from 'apollo-server';
import {IUser} from '../db/interfaces/user.interface';
import {ITag} from '../db/interfaces/tag.interface';
import {ObjectId} from 'mongoose';
import {compareIds} from '../utils';

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

  // check if an id exists in user's disabled_tags
  checkIdExist(disabled_tags: any, id: string): boolean {
    for (const tagId of disabled_tags) {
      if (compareIds(tagId, id)) return true
    }
    return false
  }

  /**
   * @throws UserInputError In case when tag doesn't exist for the given id.
   */
  async setEnable(id: string, userId?: string, enable?: boolean): Promise<void> {
    const tag = await TagModel.findById(id)
    if (!tag) {
      throw new UserInputError('Tag does not exist');
    }
    const user = await UserModel.findById(userId)
    const contains = this.checkIdExist(user.disabled_tags, id)
    if (enable && contains) {
      await UserModel.findOneAndUpdate(
        {_id: userId},
        {
          $pull: {
            disabled_tags: id,
          },
        },
      )
    } else if (!enable && !contains){
      await UserModel.findOneAndUpdate(
        {_id: userId},
        {
          $push: {
            disabled_tags: id,
          },
        },
      )
    }
  }
}

export const tagsService = new TagsService()
