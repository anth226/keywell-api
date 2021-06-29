import _ from 'lodash'
import { combineResolvers } from 'graphql-resolvers'
import type { ReqContext } from '../../../context'
import { TagModel, UserModel } from '../../../db/models'
import { isAuthenticated } from '../../../tools/auth'
import { MutationDisableTagArgs } from '../../../types/schema.types'
import { UserInputError } from 'apollo-server-errors'
import { compareIds } from '../../../utils'

async function disableTag(
  parent: null,
  args: MutationDisableTagArgs,
  ctx: ReqContext,
): Promise<boolean> {
  const { me } = ctx
  if (_.isEmpty(args.id)) {
    throw new UserInputError('ID cannot be empty')
  }
  const tagExist = await TagModel.findOne({ _id: args.id })
  if (_.isNil(tagExist)) {
    throw new UserInputError('Tag cannot found')
  }
  // avoid duplicate
  const user = await UserModel.findOne({ _id: me.id })
  const userTagExist = user.disabled_tags.some((id) => compareIds(id, args.id))
  // TODO: should return true without no update or throwing error here?
  if (userTagExist) {
    return true
  }
  await UserModel.findOneAndUpdate(
    { _id: me.id },
    {
      $push: {
        disabled_tags: args.id,
      },
    },
  )

  return true
}

export default combineResolvers(isAuthenticated, disableTag) as any
