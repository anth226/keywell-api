import {combineResolvers} from 'graphql-resolvers'
import {map} from 'p-iteration'
import type {ResolversContext} from '../../context';
import {isAuthenticated} from '../../tools/auth';
import {ChildModel} from '../../db/models'
import {Child, Diagnosis, QueryChildrenArgs, SortDirection} from '../../types/schema.types'
import {decrypt} from '../../tools/encryption';

async function children(parent: null, args: QueryChildrenArgs, ctx: ResolversContext): Promise<Child[]> {
  const sort = getSortBy(args)
  const children = await ChildModel.find({
    user: ctx.me?.id,
  }).sort(sort)
  // TODO: feed missing information: diagnosesResolver, medicationsResolver, sleepSchedule
  const results = await map(children, async child => {
    const name = await decrypt(child.get('name', Buffer))
    return {
      id: child.id,
      name,
      age: child.age,
      diagnoses: (child.diagnoses || []).map(id => ({
        id
      })) as Diagnosis[],
    } as Child
  })
  return results as Child[]
}

/**
 * @param {object} QueryChildrenArgs type
 * @returns {object} by default sorted by ascending createdAt
 */
function getSortBy(args: QueryChildrenArgs) {
  const sort: Record<string, any> = {
    createdAt: 1
  }

  if (args.sortBy?.createdAt) {
    sort.createdAt = args.sortBy.createdAt === SortDirection.Asc ? 1 : -1
  }

  return sort
}

export default combineResolvers(
  isAuthenticated,
  children,
) as any
