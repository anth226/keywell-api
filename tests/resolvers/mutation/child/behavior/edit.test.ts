import { gql } from 'apollo-server';
import server from '../../../../../src/server';
import { createTestClient } from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../../createTestServer';
import {
  BehaviorTag,
  Children,
  BehaviorRecord,
} from '../../../../../src/db/models';
import { connectDB } from '../../../../../src/db';
import { IBehaviorRecord } from '../../../../../src/db/models/types';
import {
  authorizedHeaders,
  tokenPayload,
  tokenPayloadUser2,
} from '../../../../helper';
import { getTimeOfDay } from '../../../../../src/utils';
import {
  TimeOfDay,
  BehaviorGroup,
} from '../../../../../src/types/schema.types';
import dayjs from 'dayjs';

const apolloServerClient = createTestClient(server);

const EDIT_TRACK = gql`
  mutation EditTrack($id: ID!, $behavior: BehaviorRecordInput!) {
    child {
      behavior {
        edit(id: $id, behavior: $behavior) {
          id
          behavior {
            id
            tracked
            time
            tags {
              name
              group
            }
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

describe('behavior edit mutation', () => {
  const bTagData = [
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
      order: 3,
      user_id: tokenPayload.id,
      enabled: false,
    },
    {
      name: 'behaviorTag4',
      group: BehaviorGroup.Desirable,
      order: 4,
      user_id: tokenPayload.id,
      enabled: true,
    },
  ];
  const childData = [
    {
      name: 'myChild1',
      age: 2,
      user_id: tokenPayload.id,
    },
    {
      name: 'myChild2',
      age: 3,
      user_id: tokenPayloadUser2.id,
    },
  ];

  let createdBehaviorTagsAry = [],
    createdChildrenAry = [],
    createdBehaviorRecordAry: IBehaviorRecord[];

  beforeAll(async function () {
    await connectDB();
    createdBehaviorTagsAry = await BehaviorTag.create(bTagData);
    createdChildrenAry = await Children.create(childData);

    const behaviorRecordData = [
      {
        tracked: new Date(),
        time: getTimeOfDay(),
        tags: createdBehaviorTagsAry,
        reaction: null,
        child_id: createdChildrenAry[0].id,
      },
      {
        tracked: new Date(),
        time: getTimeOfDay(),
        tags: createdBehaviorTagsAry,
        reaction: null,
        child_id: createdChildrenAry[1].id, // wrong user id for a test case
      },
    ];
    createdBehaviorRecordAry = await BehaviorRecord.create(behaviorRecordData);
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: { tags: ['behaviorTag1'] },
    };
    const res = await apolloServerClient.mutate({
      mutation: EDIT_TRACK,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      })
    );
  });

  it('does not allow to edit a non-owner behavior record', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[1].id,
      behavior: { tags: ['behaviorTag1'] },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('does not require behavior:info property to be defined', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: { tags: ['behaviorTag4'] },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const behavior = res.data.child.behavior.edit.behavior;
    expect(behavior.time).toBe(TimeOfDay.Morning);
  });

  it('does not require behavior:info property but can be specified', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag1'],
        info: { date: testDate, time: TimeOfDay.Morning },
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const behavior = res.data.child.behavior.edit.behavior;
    expect(behavior.tracked.slice(0, 10)).toBe(testDate);
    expect(behavior.time).toBe(TimeOfDay.Morning);
  });

  it('returns error if tags are not found', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag2'],
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled behavior tags');
  });

  it('returns error if tags are not correct', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag1, behaviorTag2'],
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled behavior tags');
  });

  it('tags only enabled', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag3'],
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled behavior tags');
  });

  it('update a behavior record successfully', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag1'],
        info: { date: testDate, time: TimeOfDay.Morning },
      },
    };

    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });

    // should check from db side
    const newBehaviorRecordId = res.data.child.behavior.edit.behavior?.id;
    const newBehaviorRecord = await BehaviorRecord.findOne({
      _id: newBehaviorRecordId,
    });

    expect(res.errors).toBe(undefined);
    expect(newBehaviorRecord.time).toBe(TimeOfDay.Morning);
    expect(dayjs(newBehaviorRecord.tracked).toISOString().slice(0, 10)).toBe(testDate);
  });

  afterAll(async function () {
    const bTagIds = createdBehaviorTagsAry.map((bt) => bt.id);
    const childIds = createdChildrenAry.map((cd) => cd.id);
    const behaviorRecordIds = createdBehaviorRecordAry.map((br) => br.id);
    await BehaviorTag.deleteMany({ _id: { $in: bTagIds } });
    await Children.deleteMany({ _id: { $in: childIds } });
    await BehaviorRecord.deleteMany({ _id: { $in: behaviorRecordIds } });
  });
});
