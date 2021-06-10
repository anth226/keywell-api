import {UserInputError} from 'apollo-server';
import {encrypt} from '../../../../tools/encryption';
import type {ResolversContext} from '../../../../context';
import { Children, BehaviorTag } from '../../../../db/models';
import { ChildBehaviorMutationsTrackArgs, BehaviorRecordPayload, TimeOfDay, BehaviorTag as BehaviorTagType, ParentReaction } from '../../../../types/schema.types'

export default async function (parent: null, args: ChildBehaviorMutationsTrackArgs, context: ResolversContext): Promise<BehaviorRecordPayload> {
    const { childId, behavior } = args
    const bt = await BehaviorTag.findById(childId)
    const brp: BehaviorRecordPayload = {
        id: childId,
        behavior: {
            id: childId,
            tracked: new Date(),
            time: TimeOfDay.Afternoon,
            tag: bt,
            reaction: {
                id: childId,
                tags: [],
                feeling: "good"
            }
        }
    }
    return brp
}