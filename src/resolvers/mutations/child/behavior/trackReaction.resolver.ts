import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {ChildModel, UserModel} from '../../../../db/models';
import {
  ChildBehaviorMutationsTrackReactionArgs,
  ParentReaction,
  ParentReactionPayload,
  Tag,
  TagTypeEnum,
} from '../../../../types/schema.types';
import {compareIds} from '../../../../utils';
import {tagsService} from '../../../../services';
import {BehaviorModel} from '../../../../db/models/event.model';

export default async function (
  parent: null,
  args: ChildBehaviorMutationsTrackReactionArgs,
  ctx: ResolversContext
): Promise<ParentReactionPayload> {
  const {
    trackedBehaviorId,
    reaction: {tags, feeling},
  } = args;
  const {me} = ctx;

  if ((!tags || !tags.length) && !feeling) {
    throw new UserInputError(
      'At least one tag is expected'
    );
  }

  const behaviorRecord = await BehaviorModel
    .findById(trackedBehaviorId);

  if (!behaviorRecord) {
    throw new UserInputError(
      'Invalid behavior record id provided'
    );
  }

  const child = await ChildModel.findById(behaviorRecord.child);
  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Invalid trackedBehaviorId does not have childID');
  }

  const user = await UserModel.findOne({_id: ctx.me.id});
  const reactionTags = await tagsService.findTags(TagTypeEnum.Reaction, tags, user);
  const feelingTag = feeling ? await tagsService.findTagByName(TagTypeEnum.Feeling, feeling, user) : null;

  const record = await BehaviorModel.findByIdAndUpdate(behaviorRecord.id, {
      reaction: {
        tags: reactionTags,
        feeling: feelingTag
      }
    },
    {
      new: true,
      omitUndefined: true
    }
  );

  return {
    id: record.id,
    reaction: {
      tags: reactionTags.map(t => ({
        name: t.name,
        group: t.group,
        type: t.type
      } as Tag)),
      feeling: feelingTag ? {
        name: feelingTag.name,
        group: feelingTag.group,
        type: feelingTag.type
      } as Tag : null
    } as ParentReaction,
  } as ParentReactionPayload;
}
