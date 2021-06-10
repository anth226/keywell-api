import { gql } from 'apollo-server';

import server from '../../../src/server';
import { createTestClient } from 'apollo-server-testing';
import { initServerWithHeaders } from '../../createTestServer'
import { BehaviorTag } from '../../../src/db/models';
import { connectDB } from '../../../src/db';
import { authorizedHeaders, tokenPayload, tokenPayloadUser2 } from '../../helper';
import { BehaviorGroup } from '../../../src/types/schema.types'

const apolloServerClient = createTestClient(server);

const MY_BEHAVIORTAGS = gql`
    query BehaviorTags($group: BehaviorGroup) {
      behaviorTags(group: $group) {
        name
        group
      }
    }
`;

describe('behaviorTags query', () => {
  const bTagData = [
    {
      name: 'behavior tag 1',
      group: 'DESIRABLE',
      order: 5,
      user_id: tokenPayload.id
    },
    {
      name: 'behavior tag 2',
      group: 'DESIRABLE',
      order: 4,
      user_id: tokenPayload.id
    },
    {
      name: 'behavior tag 3',
      group: 'UNDESIRABLE',
      order: 3,
      user_id: tokenPayload.id
    },
    {
      name: 'behavior tag 4',
      group: 'DESIRABLE',
      order: 2,
      enabled: false,
      user_id: tokenPayload.id
    },
    {
      name: 'behavior tag 5',
      group: 'DESIRABLE',
      order: 1,
      user_id: tokenPayloadUser2.id
    }
  ]
  const bTagCreatedArr = []
  beforeAll(async function () {
    await connectDB()
    for (const bt of bTagData) {
      const btCreated = await BehaviorTag.create({
        ...bt
      })
      bTagCreatedArr.push(btCreated)
    }
  });

  it('does not accept if not logged in', async () => {
    const variables = {}
    const res = await apolloServerClient.query({
      query: MY_BEHAVIORTAGS,
      variables
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('found behaviorTags with order', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {}
    const res = await query({
      query: MY_BEHAVIORTAGS,
      variables
    });
    expect(res.errors).toBe(undefined);
    expect(res.data.behaviorTags?.length).toBe(3);
    expect(res.data.behaviorTags[0]?.name).toBe(bTagCreatedArr[2].name);
    expect(res.data.behaviorTags[1]?.name).toBe(bTagCreatedArr[1].name);
    expect(res.data.behaviorTags[2]?.name).toBe(bTagCreatedArr[0].name);
  });

  it('found behaviorTags with group filter', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    const variables = { group: 'DESIRABLE' }
    const res = await query({
      query: MY_BEHAVIORTAGS,
      variables
    });
    expect(res.errors).toBe(undefined);
    expect(res.data.behaviorTags?.length).toBe(2);
    expect(res.data.behaviorTags[0]?.name).toBe(bTagCreatedArr[1].name);
    expect(res.data.behaviorTags[1]?.name).toBe(bTagCreatedArr[0].name);
  });

  it('found behaviorTags with property enabled to be true', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {}
    const res = await query({
      query: MY_BEHAVIORTAGS,
      variables
    });
    expect(res.errors).toBe(undefined);
    expect(res.data.behaviorTags?.length).toBe(3);
    expect(res.data.behaviorTags[0]?.name).toBe(bTagCreatedArr[2].name);
    expect(res.data.behaviorTags[1]?.name).toBe(bTagCreatedArr[1].name);
    expect(res.data.behaviorTags[2]?.name).toBe(bTagCreatedArr[0].name);
  });

  it('found behaviorTags with authenticated user', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {}
    const res = await query({
      query: MY_BEHAVIORTAGS,
      variables
    });
    expect(res.errors).toBe(undefined);
    expect(res.data.behaviorTags?.length).toBe(3);
    expect(res.data.behaviorTags[0]?.name).toBe(bTagCreatedArr[2].name);
    expect(res.data.behaviorTags[1]?.name).toBe(bTagCreatedArr[1].name);
    expect(res.data.behaviorTags[2]?.name).toBe(bTagCreatedArr[0].name);
  });

  afterAll(async function () {
    for (const bt of bTagCreatedArr) {
      await BehaviorTag.deleteOne({
        _id: bt.id
      })
    }
  })
});