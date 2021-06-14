import { gql } from 'apollo-server';

import server from '../../../../../src/server';
import { createTestClient } from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../../createTestServer';
import { BehaviorRecord, Children } from '../../../../../src/db/models';
import { connectDB } from '../../../../../src/db';
import { authorizedHeaders, tokenPayload } from '../../../../helper';
import { TimeOfDay } from '../../../../../src/types/schema.types';

const apolloServerClient = createTestClient(server);

const ADD_TRACK = gql`
  mutation AddTrack($childId: ID!, $behavior: BehaviorRecordInput!) {
    child {
      behavior {
        track(childId: $childId, behavior: $behavior) {
          id
          behavior {
            id
            tracked
            tags {
              name
              group
            }
            time
            reaction {
              id
              feeling
              tags
            }
          }
        }
      }
    }
  }
`;

describe('child:behavior:track mutation', () => {
  let childId: string;

  beforeAll(async function () {
    await connectDB();

    const child = await Children.create({
      name: 'test_child',
      age: 1,
      user_id: tokenPayload.id,
    });
    childId = child.id;
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      childId,
      behavior: {
        tags: ['First tag'],
        info: {
          date: '2021-06-12',
          time: TimeOfDay.Morning,
        },
      },
    };
    const res = await apolloServerClient.mutate({
      mutation: ADD_TRACK,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      })
    );
  });

  it('does not accept empty childId field', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      childId: undefined,
      behavior: {
        tags: ['First tag'],
        info: {
          date: '2021-06-12',
          time: TimeOfDay.Morning,
        },
      },
    };

    const res = await mutate({
      mutation: ADD_TRACK,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual(
      'Variable "$childId" got invalid value undefined; Expected non-nullable type "ID!" not to be null.'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('does not accept empty behavior field', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      childId,
      behavior: undefined,
    };
    const res = await mutate({
      mutation: ADD_TRACK,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toContain(
      'Variable "$behavior" got invalid value undefined;'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('behavior:tags field should be inputted.', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      childId,
      behavior: {
        tags: undefined,
        info: {
          date: '2021-06-12',
          time: TimeOfDay.Morning,
        },
      },
    };
    const res = await mutate({
      mutation: ADD_TRACK,
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

  it('create new track successfully', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      childId,
      behavior: {
        tags: ['First tag'],
        info: {
          date: '2021-06-12',
          time: TimeOfDay.Morning,
        },
      },
    };
    const res = await mutate({
      mutation: ADD_TRACK,
      variables,
    });

    const trackCreatedId = res.data?.child?.behavior?.track?.id;
    BehaviorRecord.deleteOne({
      _id: trackCreatedId,
    })
      .then((res) => console.log(`Deleted ${res.deletedCount} track test`))
      .catch((err) => console.error('Failed when delete test track ', err));

    const mockReactionCreatedId =
      res.data?.child?.behavior?.track?.behavior?.reaction?.id;

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          behavior: {
            track: {
              id: trackCreatedId,
              behavior: {
                id: trackCreatedId,
                tracked: '2021-05-07T07:30:21+00:00', // It's default value of this field.
                tags: [],
                time: TimeOfDay.Morning,
                //TODO: should be replaced with real db data. It's default mock data.
                reaction: {
                  id: mockReactionCreatedId,
                  feeling: 'Hello World',
                  tags: ['Hello World', 'Hello World'],
                },
              },
            },
          },
        },
      })
    );
  });

  afterAll(async function () {
    await Children.deleteOne({
      _id: childId,
    });
  });
});
