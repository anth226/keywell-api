import {ReqContext} from '../../context'
import {
  QueryTimelineArgs,
  TimelineData,
} from '../../types/schema.types'
import {isAuthenticated} from '../../tools/auth'
import {combineResolvers} from 'graphql-resolvers'
import _ from 'lodash'
import {eventService} from '../../services'
import {ChildModel} from '../../db/models'

async function timeline(
  parent: null,
  args: QueryTimelineArgs,
  ctx: ReqContext,
): Promise<TimelineData> {
  const userId = ctx.me.id
  const {from, to} = args
  const childs = await ChildModel.find({user: userId})
  const childIds = childs.map(c => c.id)
  const [events, hasEventsAfter, hasEventsBefore] = await Promise.all([
    eventService.find(childIds, from, to),
    eventService.hasEventsAfter(childIds, to),
    eventService.hasEventsBefore(childIds, from)
  ])

  return {
    from: _.isNil(from) ? null : from,
    to: _.isNil(to) ? null : to,
    events,
    hasEventsAfter,
    hasEventsBefore
  }
}

export default combineResolvers(isAuthenticated, timeline) as any
