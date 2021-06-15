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
  IBehaviorRecord,
  IParentReaction,
  IChildren,
  IBehaviorTag,
} from '../../../../../src/db/models/types';
import { connectDB } from '../../../../../src/db';
import {
  authorizedHeaders,
  tokenPayload,
  tokenPayloadUser2,
} from '../../../../helper';
import { Feelings } from '../../../../../src/resolvers/types';
import { TimeOfDay } from '../../../../../src/types/schema.types';
import { getTimeOfDay } from '../../../../../src/utils';

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
      group: 'DESIRABLE',
      order: 1,
      user_id: tokenPayload.id,
    },
    {
      name: 'behaviorTag2',
      group: 'DESIRABLE',
      order: 2,
      user_id: tokenPayloadUser2.id,
    },
    {
      name: 'behaviorTag3',
      group: 'DESIRABLE',
      order: 1,
      user_id: tokenPayload.id,
    },
  ];
  const mockChildren = {
    name: 'myChild1',
    age: 21,
    user_id: tokenPayload.id,
  };

  let createdBehaviorTagsAry: IBehaviorTag[],
    createdChild: IChildren,
    trackedBehaviorId: string;

  let tagsIdAry: string[], tagsNameAry: string[];

  beforeAll(async function () {
    await connectDB();

    createdBehaviorTagsAry = await BehaviorTag.create(mockBehaviorTags);
    tagsIdAry = createdBehaviorTagsAry.map((tag) => tag.id);
    tagsNameAry = createdBehaviorTagsAry.map((tag) => tag.name);

    createdChild = await Children.create(mockChildren);
    const behavior = await BehaviorRecord.create({
      tracked: new Date(),
      time: TimeOfDay.Morning,
      tags: tagsIdAry,
      child_id: createdChild.id,
      reaction: null,
    });
    trackedBehaviorId = behavior.id;
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
      trackedBehaviorId: '    ',
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
      'Cast to ObjectId failed for value "    " (type string) at path "_id" for model "behaviorRecord"'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
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

  it('does not accept non-existing behavior tags', async () => {
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

    const trackReactionCreatedId = res.data?.child?.behavior?.trackReaction?.id;
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
  });

  afterAll(async function () {
    await Promise.all([
      BehaviorTag.deleteMany({ _id: { $in: tagsIdAry } }),
      Children.findByIdAndDelete(createdChild.id),
      BehaviorRecord.findByIdAndDelete(trackedBehaviorId),
    ]);
  });
});
