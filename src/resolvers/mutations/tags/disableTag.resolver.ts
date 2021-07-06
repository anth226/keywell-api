import type {ReqContext} from '../../../context'
import {EnableTagPayload, TagMutationsDisableArgs} from '../../../types/schema.types'
import {UserInputError} from 'apollo-server-errors'
import {tagsService} from '../../../services';

export default async function (
  parent: null,
  args: TagMutationsDisableArgs,
  ctx: ReqContext,
): Promise<EnableTagPayload> {
  const {me} = ctx
  if (!args.id) {
    throw new UserInputError('ID cannot be empty')
  }
  await tagsService.setEnable(args.id, me.id, false)
  return {
    id: args.id,
    enabled: false
  } as EnableTagPayload
}