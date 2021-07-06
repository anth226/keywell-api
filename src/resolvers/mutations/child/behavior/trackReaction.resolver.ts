import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {BehaviorModel, ChildModel, UserModel} from '../../../../db/models';
import {
  ChildBehaviorMutationsTrackReactionArgs,
  ParentReaction,
  ParentReactionPayload,
  TagTypeEnum,
} from '../../../../types/schema.types';
import {compareIds} from '../../../../utils';
import {tagsService} from '../../../../services';
import {tagToSchemaTag} from '../../../../utils/convert';

export default async function (
  parent: null,
  args: ChildBehaviorMutationsTrackReactionArgs,
  ctx: ResolversContext
): Promise<ParentReactionPayload> {
  const {
    trackedBehaviorId,
    reaction: {tags, feelings},
  } = args;
  const {me} = ctx;

  if ((!tags || !tags.length) && (!feelings || !feelings.length)) {
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
  const feelingTags = await tagsService.findTags(TagTypeEnum.Feeling, feelings, user);

  const record = await BehaviorModel.findByIdAndUpdate(behaviorRecord.id, {
      reaction: {
        tags: reactionTags,
        feelings: feelingTags
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
      tags: reactionTags.map(t => tagToSchemaTag(t)),
      feelings: feelingTags.map(t => tagToSchemaTag(t))
    } as ParentReaction,
  } as ParentReactionPayload;
}
