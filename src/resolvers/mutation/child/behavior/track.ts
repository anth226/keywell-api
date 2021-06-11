import type {ResolversContext} from '../../../../context';
import { Children, BehaviorTag } from '../../../../db/models';
import { ChildBehaviorMutationsTrackArgs, BehaviorRecordPayload, TimeOfDay, BehaviorTag as BehaviorTagType, ParentReaction } from '../../../../types/schema.types'

export default async function (parent: null, args: ChildBehaviorMutationsTrackArgs, context: ResolversContext): Promise<BehaviorRecordPayload> {
    const { childId, behavior } = args
    console.log("childId---",childId)
    console.log("behavior---",behavior.info.date)
    console.log("behavior---",behavior.info.time)
    console.log("behavior---",behavior.tags)

    const child = await Children.findById(childId)
    const bts = await BehaviorTag.find({name: {$in: behavior.tags}})
    console.log("child---",child.id)
    console.log("bts---", bts)

    const brp: BehaviorRecordPayload = {
        id: child.id,
        behavior: {
            id: childId,
            tracked: new Date(),
            time: TimeOfDay.Afternoon,
            tags: bts,
            reaction: null
        }
    }
    return brp
}