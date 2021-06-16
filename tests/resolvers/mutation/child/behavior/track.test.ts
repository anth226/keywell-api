import { gql } from 'apollo-server';
import server from '../../../../../src/server';
import { createTestClient } from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../../createTestServer'
import { BehaviorTag, Children, BehaviorRecord } from '../../../../../src/db/models';
import { connectDB } from '../../../../../src/db';
import { authorizedHeaders, tokenPayload, tokenPayloadUser2 } from '../../../../helper';
import { getTimeOfDay} from '../../../../../src/utils';
import { TimeOfDay, BehaviorGroup } from '../../../../../src/types/schema.types';

const apolloServerClient = createTestClient(server);

const MY_TRACK = gql`
    mutation BehaviorTrack($childId: ID!, $behavior: BehaviorRecordInput!) {
      child {
        behavior {
          track(childId: $childId, behavior: $behavior){
            id
            behavior {
              id
              tracked
              time
              tags {
                name
                group
              }
            }
          }
        }
      }
    }
`;

describe('behavior track mutation', () => {
  const bTagData = [
    {
      name: 'behaviorTag1',
      group: BehaviorGroup.Desirable,
      order: 1,
      user_id: tokenPayload.id
    },
    {
      name: 'behaviorTag2',
      group: BehaviorGroup.Desirable,
      order: 2,
      user_id: tokenPayloadUser2.id
    },
    {
      name: 'behaviorTag3',
      group: BehaviorGroup.Desirable,
      order: 1,
      user_id: tokenPayload.id,
      enabled: false
    },
  ]
  const childData = [
    {
      name: 'myChild1',
      age: 2,
      user_id: tokenPayload.id
    },
    {
      name: 'myChild2',
      age: 3,
      user_id: tokenPayloadUser2.id
    }
  ]
  let bTagCreatedArr = [], createdChildArr = []
  beforeAll(async function () {
    await connectDB()
    bTagCreatedArr = await BehaviorTag.create(bTagData)
    createdChildArr = await Children.create(childData)
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      childId: createdChildArr[0].id, 
      behavior: {tags: ['behaviorTag1']}
    }
    const res = await apolloServerClient.mutate({
      mutation: MY_TRACK,
      variables
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('does not allow to track for other`s child', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[1].id, 
      behavior: {tags: ['behaviorTag1']}
    }
    const res = await mutate({
        mutation: MY_TRACK,
        variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('does not require info property to be defined', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id, 
      behavior: {tags: ['behaviorTag1']}
    }
    const res = await mutate({
        mutation: MY_TRACK,
        variables
    });
    expect(res.errors).toBe(undefined);
    const behavior = res.data.child.behavior.track.behavior
    expect(behavior.time).toBe(getTimeOfDay())
    await BehaviorRecord.deleteOne({_id: behavior.id})
  });

  it('does not require info property but can be specified', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const testDate = '2021-09-12'
    const variables = {
      childId: createdChildArr[0].id, 
      behavior: {
        tags: ['behaviorTag1'],
        info: {date: testDate, time: TimeOfDay.Morning}
      }
    }
    const res = await mutate({
        mutation: MY_TRACK,
        variables
    });
    expect(res.errors).toBe(undefined);
    const behavior = res.data.child.behavior.track.behavior
    expect(behavior.tracked.slice(0, 10)).toBe(testDate)
    expect(behavior.time).toBe(TimeOfDay.Morning)
    await BehaviorRecord.deleteOne({_id: behavior.id})
  });

  it('returns bad_user_input error if child not found', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[1].id, 
      behavior: {
        tags: ['behaviorTag1']
      }
    }
    const res = await mutate({
        mutation: MY_TRACK,
        variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('returns error if tags not found', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id, 
      behavior: {
        tags: ['behaviorTag2']
      }
    }
    const res = await mutate({
        mutation: MY_TRACK,
        variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled behavior tags');
  });

  it('returns error if tags are not correct', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id, 
      behavior: {
        tags: ['behaviorTag1, behaviorTag2']
      }
    }
    const res = await mutate({
        mutation: MY_TRACK,
        variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled behavior tags');
  });

  it('tags only enabled', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id, 
      behavior: {
        tags: ['behaviorTag3']
      }
    }
    const res = await mutate({
        mutation: MY_TRACK,
        variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled behavior tags');
  });

  afterAll(async function () {
    const bTagIds = bTagCreatedArr.map(bt => bt.id)
    const childIds = createdChildArr.map(cd => cd.id)
    await BehaviorTag.deleteMany({_id: {$in: bTagIds}})
    await Children.deleteMany({_id: {$in: childIds}})
  })
});