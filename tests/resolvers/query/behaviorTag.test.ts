import { gql } from 'apollo-server';

import server from '../../../src/server';
import { createTestClient } from 'apollo-server-testing';
import { initServerWithHeaders } from '../../createTestServer';
import { BehaviorTagModel, IBehaviorTag } from '../../../src/db/models';
import { connectDB } from '../../../src/db';
import { authorizedHeaders, tokenPayload } from '../../helper';
import { BehaviorGroup } from '../../../src/types/schema.types';

const apolloServerClient = createTestClient(server);

const BEHAVIOR_TAG_QUERY = gql`
  query BEHAVIORTAGS($group: BehaviorGroup, $userID: ID) {
    behaviorTags(group: $group, userID: $userID) {
      name
      user_id
      order
      group
      enabled
    }
  }
`;

describe('Behavior tag query', () => {
  let behaviorTagCreated: IBehaviorTag[];

  beforeAll(async function () {
    await connectDB();
    behaviorTagCreated = await BehaviorTagModel.create([
      {
        name: 'aggression',
        group: BehaviorGroup.Undesirable,
        order: 1,
        user_id: tokenPayload.id,
        enabled: true,
      },
      {
        name: 'joy',
        group: BehaviorGroup.Desirable,
        order: 2,
        user_id: tokenPayload.id,
        enabled: true,
      },
      {
        name: 'motivated',
        group: BehaviorGroup.Desirable,
        order: 3,
        user_id: tokenPayload.id,
        enabled: false,
      },
      {
        name: 'lying',
        group: BehaviorGroup.Undesirable,
        order: 4,
        user_id: tokenPayload.id,
        enabled: true,
      },
      {
        name: 'Laugh',
        group: BehaviorGroup.Desirable,
        order: 5,
        user_id: '60c17fcae279472bb47bcadf',
        enabled: true,
      },
    ]);
  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: BEHAVIOR_TAG_QUERY,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      })
    );
  });

  it('returns an ordered list of tags', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders);
    const res = await query({
      query: BEHAVIOR_TAG_QUERY,
      variables: {
        userID: '60af9ae98deeb37b33df9d0d',
      },
    });

    const firstThreeTags = res.data.behaviorTags.slice(0, 2);

    let orderNumber: number;

    firstThreeTags.forEach(({ order }: IBehaviorTag, index) => {
      if (index === 0) {
        orderNumber = order;
      } else {
        expect(order).toEqual(orderNumber + 1);
        orderNumber++;
      }
    });
  });

  it('uses group parameter for filtering tags', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders);
    const res = await query({
      query: BEHAVIOR_TAG_QUERY,
      variables: {
        userID: '60af9ae98deeb37b33df9d0d',
        group: BehaviorGroup.Desirable,
      },
    });

    const tags = res.data.behaviorTags;

    tags.forEach((tag: IBehaviorTag) => {
      expect(tag.group).toEqual(BehaviorGroup.Desirable);
    });
  });

  it('only return tags that are enabled', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders);
    const res = await query({
      query: BEHAVIOR_TAG_QUERY,
      variables: {
        userID: '60af9ae98deeb37b33df9d0d',
      },
    });

    const tags = res.data.behaviorTags;

    tags.forEach((tag: IBehaviorTag) => {
      expect(tag.enabled).toEqual(true);
    });
  });

  it('only returns tags that belong to the authenticated user', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders);
    const res = await query({
      query: BEHAVIOR_TAG_QUERY,
      variables: {
        userID: '60af9ae98deeb37b33df9d0d',
      },
    });

    const tags = res.data.behaviorTags;

    tags.forEach((tag: IBehaviorTag) => {
      expect(tag.user_id).toEqual(tokenPayload.id);
    });
  });

  afterAll(async function () {
    const createdItemsIdArr = behaviorTagCreated.map((tag) => tag.id);
    await BehaviorTagModel.deleteMany({ _id: { $in: createdItemsIdArr } });
  });
});
