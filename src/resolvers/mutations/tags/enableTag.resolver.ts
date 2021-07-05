import _ from 'lodash'
import {combineResolvers} from 'graphql-resolvers'
import type {ReqContext} from '../../../context'
import {TagModel, UserModel} from '../../../db/models'
import {isAuthenticated} from '../../../tools/auth'
import {MutationEnableTagArgs} from '../../../types/schema.types'
import {UserInputError} from 'apollo-server-errors'

async function enableTag(
    parent: null,
    args: MutationEnableTagArgs,
    ctx: ReqContext,
): Promise<boolean> {
    const {me} = ctx
    if (_.isEmpty(args.id)) {
        throw new UserInputError('ID cannot be empty')
    }
    console.log(args.id);
    const tagExist = await TagModel.findOne({_id: args.id})

    if (_.isNil(tagExist)) {
        throw new UserInputError('Tag cannot found')
    }

    await UserModel.findOneAndUpdate(
        {_id: me.id},
        {
            $pull: {
                disabled_tags: args.id
            },
        },
    )

    return true
}

export default combineResolvers(isAuthenticated, enableTag) as any
