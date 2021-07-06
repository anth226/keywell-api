import type {ReqContext} from '../../context'
import {EventRecordType} from '../../db/models'
import IEventRecord from '../../db/interfaces/event.interface'

type ResolveType = `${EventRecordType}Record`

const resolver = {
  __resolveType: (parent: IEventRecord, arg: null, ctx: ReqContext): ResolveType => {
    if (Object.values(EventRecordType).includes(parent.__type)) {
      return `${parent.__type}Record` as ResolveType
    }
    return null
  },
}

export default resolver
