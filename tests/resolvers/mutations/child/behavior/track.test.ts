import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {ChildModel, TagModel, UserModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper';
import {getTimeOfDay} from '../../../../../src/utils';
import {TagTypeEnum, TimeOfDay} from '../../../../../src/types/schema.types';
import {ITag} from '../../../../../src/db/interfaces/tag.interface';
import {BehaviorModel} from '../../../../../src/db/models/event.model';

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
                        date
                        time
                        notes
                        tags {
                            name
                            type
                            group
                        }
                        reaction {
                            feeling {
                                name
                                type
                                group
                            }
                            tags {
                                name
                                type
                                group
                            }
                        }
                    }
                }
            }
        }
    }
`;

describe('behavior track mutations', () => {
  const bTagData = [
    {
      type: TagTypeEnum.Behavior,
      name: 'behaviorTag1',
      group: 'DESIRABLE',
      order: 1
    },
    {
      type: TagTypeEnum.Behavior,
      name: 'behaviorTag2',
      group: 'DESIRABLE',
      order: 2
    },
    {
      type: TagTypeEnum.Behavior,
      name: 'behaviorTag3',
      group: 'DESIRABLE',
      order: 1
    },
  ] as ITag[]
  const childData = [
    {
      name: 'myChild1',
      age: 2,
      user: tokenPayload.id
    },
    {
      name: 'myChild2',
      age: 3,
      user: tokenPayloadUser2.id
    }
  ]
  const userData = [
    {
      _id: tokenPayload.id,
      name: tokenPayload.name,
      email: tokenPayload.email,
      token: 'any',
      password: 'any',
      disabled_tags: []
    }
  ];
  let bTagCreatedArr = [], createdChildArr = [], createdUserArr = []
  beforeAll(async function () {
    await connectDB()
    bTagCreatedArr = await TagModel.create(bTagData)
    createdChildArr = await ChildModel.create(childData)
    userData[0].disabled_tags = [bTagCreatedArr[bTagCreatedArr.length - 1].id] // last tag behaviorTag3 is disabled for current user
    createdUserArr = await UserModel.create(userData)
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    await BehaviorModel.deleteOne({_id: behavior.id})
  });

  it('does not require info property but can be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    expect(behavior.date).toBe(testDate)
    expect(behavior.time).toBe(TimeOfDay.Morning)
    await BehaviorModel.deleteOne({_id: behavior.id})
  });

  it('returns bad_user_input error if child not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      behavior: {
        tags: ['behaviorTag22']
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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

  it('returns full info requested', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      behavior: {
        tags: ['behaviorTag1'],
        info: {date: '2021-01-02', time: TimeOfDay.Morning, notes:'TEST NOTES'}
      }
    }

    const res = await mutate({
      mutation: MY_TRACK,
      variables
    });

    const record = await BehaviorModel
      .findById(res.data.child.behavior.track.id);

    expect(record).toBeDefined();
    expect(record.tracked).toBeDefined()
    expect(record.time).toEqual(TimeOfDay.Morning)
    expect(record.date).toEqual('2021-01-02');
    expect(record.notes).toEqual('TEST NOTES');
    expect(record.child.toString()).toEqual(createdChildArr[0].id.toString());

    expect(res.errors).toBe(undefined);
    expect(res.data.child.behavior.track).toEqual(
      jasmine.objectContaining({
        id: record.id,
        behavior: {
          id: record.id,
          tracked: record.tracked.toISOString(),
          time: TimeOfDay.Morning,
          date: '2021-01-02',
          notes: 'TEST NOTES',
          tags: [
            {
              group: 'DESIRABLE',
              name: 'behaviorTag1',
              type: TagTypeEnum.Behavior
            }
          ],
          reaction: null
        }
      })
    );
  })

  it('should require at least one tag to be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      behavior: {
        tags: []
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
    expect(res.errors?.[0].message).toEqual('At least one tag is expected');
  });

  afterAll(async function () {
    const bTagIds = bTagCreatedArr.map(bt => bt.id)
    const childIds = createdChildArr.map(cd => cd.id)
    const userIds = createdUserArr.map(u => u.id)
    await TagModel.deleteMany({_id: {$in: bTagIds}})
    await ChildModel.deleteMany({_id: {$in: childIds}})
    await UserModel.deleteMany({_id: {$in: userIds}})
  })
});
