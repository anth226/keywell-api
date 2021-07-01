import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../context';
import {ChildModel, EventModel} from '../../../db/models';
import {ChildMutationsDeleteRecordArgs, DeletePayload} from '../../../types/schema.types'
import {compareIds} from '../../../utils';

export default async function (
  parent: null,
  args: ChildMutationsDeleteRecordArgs,
  ctx: ResolversContext
): Promise<DeletePayload> {
  const {recordId} = args
  const {me} = ctx;

  if (!recordId.trim()) {
    throw new UserInputError('RecordID must not be empty');
  }

  const eventRecord = await EventModel.findById(recordId)
  if (!eventRecord) {
    throw new UserInputError('Wrong record id');
  }

  const child = await ChildModel.findById(eventRecord.child);

  if (!child || !compareIds(child.user, me.id)) {
    throw new UserInputError('Wrong record id');
  }

  // softdelete record by remove function
  await eventRecord.remove()
  return {
    id: recordId,
    deleted: true
  } as DeletePayload
}
