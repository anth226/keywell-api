import { gql } from 'apollo-server';

import server from '../../../../../src/server';
import { createTestClient } from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../../createTestServer';
import {
  BehaviorRecord,
  ParentReaction,
  BehaviorTag,
  Children,
} from '../../../../../src/db/models';
import {
  IChildren,
  IBehaviorTag,
  IBehaviorRecord,
} from '../../../../../src/db/models/types';
import { connectDB } from '../../../../../src/db';
import {
  authorizedHeaders,
  tokenPayload,
  tokenPayloadUser2,
} from '../../../../helper';
import { Feelings } from '../../../../../src/resolvers/types';
import {
  TimeOfDay,
  BehaviorGroup,
} from '../../../../../src/types/schema.types';
import { Types } from 'mongoose';

const apolloServerClient = createTestClient(server);

const ADD_REACTION = gql`
  mutation AddReaction(
    $trackedBehaviorId: ID!
    $reaction: ParentReactionInput!
  ) {
    child {
      behavior {
        trackReaction(
          trackedBehaviorId: $trackedBehaviorId
          reaction: $reaction
        ) {
          id
          reaction {
            id
            tags
            feeling
          }
        }
      }
    }
  }
`;

describe('child:behavior:trackReaction mutation', () => {
  const mockBehaviorTags = [
    {
      name: 'behaviorTag1',
      group: BehaviorGroup.Desirable,
      order: 1,
      user_id: tokenPayload.id,
    },
    {
      name: 'behaviorTag2',
      group: BehaviorGroup.Desirable,
      order: 2,
      user_id: tokenPayloadUser2.id,
    },
    {
      name: 'behaviorTag3',
      group: BehaviorGroup.Desirable,
      order: 1,
      user_id: tokenPayload.id,
    },
  ];
  const mockChildren = [
    {
      name: 'myChild1',
      age: 21,
      user_id: tokenPayload.id,
    },
    {
      name: 'myChild2',
      age: 23,
      user_id: tokenPayloadUser2.id,
    },
  ];

  let createdBehaviorTagsAry: IBehaviorTag[],
    createdChildAry: IChildren[],
    trackedBehaviorId: string,
    behaviorAry: IBehaviorRecord[];

  let tagsIdAry: string[], tagsNameAry: string[];

  beforeAll(async function () {
    await connectDB();

    createdBehaviorTagsAry = await BehaviorTag.create(mockBehaviorTags);
    tagsIdAry = createdBehaviorTagsAry.map((tag) => tag.id);
    tagsNameAry = createdBehaviorTagsAry.map((tag) => tag.name);

    createdChildAry = await Children.create(mockChildren);
    behaviorAry = await BehaviorRecord.create([
      {
        tracked: new Date(),
        time: TimeOfDay.Morning,
        tags: tagsIdAry,
        child_id: createdChildAry[0].id,
        reaction: null,
      },
      {
        tracked: new Date(),
        time: TimeOfDay.Afternoon,
        tags: tagsIdAry,
        child_id: createdChildAry[1].id,
        reaction: null,
      },
    ]);
    trackedBehaviorId = behaviorAry[0].id;
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: tagsNameAry,
        feeling: Feelings.happy,
      },
    };
    const res = await apolloServerClient.mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      })
    );
  });

  it('does not accept empty trackedBehaviorId field', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId: undefined,
      reaction: {
        tags: tagsIdAry,
        feeling: Feelings.happy,
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toContain(
      'Variable "$trackedBehaviorId" got invalid value undefined'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('does not accept non-existing behavior record', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId: '60c9173fd699b20da00e4b5f',
      reaction: {
        tags: tagsNameAry,
        feeling: Feelings.happy,
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual(
      'Invalid trackedBehaviorId does not exist in behaviorRecord'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('does not accept empty reaction field', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: undefined,
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toContain(
      'Variable "$reaction" got invalid value undefined;'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  
  it('should be return bad_user_input if behavior tags not found.', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId: behaviorAry[1].id,
      reaction: {
        tags: tagsNameAry,
        feeling: Feelings.happy,
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual(
      'Invalid trackedBehaviorId does not have childID'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('reaction:tags field should be inputted.', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: undefined,
        feeling: Feelings.happy,
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toContain(
      'Field "tags" of required type "[String!]!" was not provided.'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('should be return bad_user_input if behavior record is not existed.', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: ['mockTag1', 'mockTag2'],
        feeling: Feelings.happy,
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual(
      'Invalid or disabled behavior tags'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });
  
  it('create new reaction successfully', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: tagsNameAry,
        feeling: Feelings.happy,
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    // should check from db side

    const trackReactionCreatedId = res.data?.child?.behavior?.trackReaction?.id;

    const parentReactionCreated = await ParentReaction.findOne({
      _id: trackReactionCreatedId,
    }).select('+behavior_record_id');

    const newReactionTagsIdAry =
      res.data?.child?.behavior?.trackReaction?.reaction?.tags;
    ParentReaction.deleteOne({
      _id: trackReactionCreatedId,
    })
      .then((res) => console.log(`Deleted ${res.deletedCount} reaction test`))
      .catch((err) => console.error('Failed when delete test reaction ', err));

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          behavior: {
            trackReaction: {
              id: trackReactionCreatedId,
              reaction: {
                id: trackReactionCreatedId,
                tags: newReactionTagsIdAry,
                feeling: Feelings.happy,
              },
            },
          },
        },
      })
    );
    expect(parentReactionCreated).toEqual(
      jasmine.objectContaining({
        behavior_record_id: Types.ObjectId(trackedBehaviorId),
      })
    );
    expect(parentReactionCreated).toEqual(
      jasmine.objectContaining({ id: trackReactionCreatedId })
    );
  });

  afterAll(async function () {
    await Promise.all([
      BehaviorTag.deleteMany({ _id: { $in: tagsIdAry } }),
      Children.deleteMany({
        _id: { $in: createdChildAry.map((child) => child.id) },
      }),
      BehaviorRecord.deleteMany({
        _id: { $in: behaviorAry.map((behavior) => behavior.id) },
      }),
    ]);
  });
});
