import {gql} from 'apollo-server'

import server from '../../../src/server'
import {createTestClient} from 'apollo-server-testing'
import arraySort from 'array-sort'
import {initServerWithHeaders} from '../../createTestServer'
import {connectDB} from '../../../src/db'
import {authorizedHeaders, tokenPayload} from '../../helper'
import {TagTypeEnum} from '../../../src/types/schema.types'
import {TagModel, UserModel} from '../../../src/db/models'
import {encrypt} from '../../../src/tools/encryption'
import {IProtoTag} from '../../../src/db/interfaces/tag.interface';
import {tagsService} from '../../../src/services';

const apolloServerClient = createTestClient(server)

const TAGS_QUERY = gql`
    query Tags($type: TagTypeEnum!, $group: String) {
        tags(type: $type, group: $group) {
            # id
            name
            group
            type
        }
    }
`

const behaviorDesirable: IProtoTag[] = [
  'confidence',
  'cooperation',
  'flexibility',
].map((name, idx) => ({
  type: TagTypeEnum.Behavior,
  group: 'Desirable',
  name,
  order: idx,
}))

const behaviorUndesirable: IProtoTag[] = [
  'aggression',
  'anxiety',
  'compulsions',
].map((name, idx) => ({
  type: TagTypeEnum.Behavior,
  group: 'Undesirable',
  name,
  order: idx,
}))

describe('tags queries', () => {
  const queryVars = {
    type: TagTypeEnum.Behavior,
  }
  beforeAll(async function () {
    await connectDB()
    await TagModel.create([...behaviorDesirable, ...behaviorUndesirable])
  })

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: TAGS_QUERY,
      variables: {
        ...queryVars,
      },
    })

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      }),
    )
  })

  it('should get tags ordered successfully', async () => {
    // create user
    const user = await UserModel.create({
      ...tokenPayload,
      _id: tokenPayload.id,
      name: await encrypt(tokenPayload.name)
    })
    // 
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TAGS_QUERY,
      variables: {
        ...queryVars,
      },
    })
    await UserModel.deleteOne({_id: user.id})

    const results = arraySort(
      [...behaviorDesirable, ...behaviorUndesirable],
      ['group', 'order', 'name'],
    )
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        tags: results
          .map(t => ({name: t.name, group: t.group, type: t.type})),
      }),
    )
  })

  it('should get tags filter by group and ordered successfully', async () => {
    // create user
    const user = await UserModel.create({
      ...tokenPayload,
      _id: tokenPayload.id,
      name: await encrypt(tokenPayload.name)
    })
    // 
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TAGS_QUERY,
      variables: {
        ...queryVars,
        group: 'Undesirable'
      },
    })
    await UserModel.deleteOne({_id: user.id})

    const results = arraySort(
      behaviorUndesirable,
      ['group', 'order', 'name'],
    )
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        tags: results
          .map(t => ({name: t.name, group: t.group, type: t.type})),
      }),
    )
  })

  it('should not get disabled tag', async () => {
    // create user
    const tagExcluded = await TagModel.findOne({
      group: 'Undesirable',
      order: 1
    })
    const user = await UserModel.create({
      ...tokenPayload,
      _id: tokenPayload.id,
      name: await encrypt(tokenPayload.name),
      disabled_tags: [tagExcluded.id]
    })
    // 
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TAGS_QUERY,
      variables: {
        ...queryVars,
        group: 'Undesirable'
      },
    })
    await UserModel.deleteOne({_id: user.id})

    // filter out disabled
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        tags: behaviorUndesirable
          .filter(t => t.name !== tagExcluded.name)
          .map(t => ({name: t.name, group: t.group, type: t.type})),
      }),
    )
  })

  afterAll(async function () {
    await TagModel.deleteMany()
  })
})
