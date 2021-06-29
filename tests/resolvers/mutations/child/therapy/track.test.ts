import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {TherapyModel, ChildModel, TagModel, UserModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper';
import {getTimeOfDay} from '../../../../../src/utils';
import {TagTypeEnum, TimeOfDay} from '../../../../../src/types/schema.types';
import {DefaultTagGroup, ITag} from '../../../../../src/db/interfaces';

const apolloServerClient = createTestClient(server);

const MY_TRACK = gql`
    mutation TherapyTrack($childId: ID!, $therapy: TherapyRecordInput!) {
        child {
          therapy {
                track(childId: $childId, therapy: $therapy){
                    id
                    therapy {
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
                    }
                }
            }
        }
    }
`;

describe('therapy track mutations', () => {
  const bTagData = [
    {
      type: TagTypeEnum.Therapy,
      name: 'therapyTag1',
      group: DefaultTagGroup,
      order: 1
    },
    {
      type: TagTypeEnum.Therapy,
      name: 'therapyTag2',
      group: DefaultTagGroup,
      order: 2
    },
    {
      type: TagTypeEnum.Therapy,
      name: 'therapyTag3',
      group: DefaultTagGroup,
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
    userData[0].disabled_tags = [bTagCreatedArr[bTagCreatedArr.length - 1].id] // last tag therapyTag3 is disabled for current user
    createdUserArr = await UserModel.create(userData)
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      childId: createdChildArr[0].id,
      therapy: {tags: ['therapyTag1']}
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
      therapy: {tags: ['therapyTag1']}
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
      therapy: {tags: ['therapyTag1']}
    }
    const res = await mutate({
      mutation: MY_TRACK,
      variables
    });
    expect(res.errors).toBe(undefined);
    const therapy = res.data.child.therapy.track.therapy
    expect(therapy.time).toBe(getTimeOfDay())
    await TherapyModel.deleteOne({_id: therapy.id})
  });

  it('does not require info property but can be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const testDate = '2021-09-12'
    const variables = {
      childId: createdChildArr[0].id,
      therapy: {
        tags: ['therapyTag1'],
        info: {date: testDate, time: TimeOfDay.Morning}
      }
    }
    const res = await mutate({
      mutation: MY_TRACK,
      variables
    });
    expect(res.errors).toBe(undefined);
    const therapy = res.data.child.therapy.track.therapy
    expect(therapy.date).toBe(testDate)
    expect(therapy.time).toBe(TimeOfDay.Morning)
    await TherapyModel.deleteOne({_id: therapy.id})
  });

  it('returns bad_user_input error if child not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[1].id,
      therapy: {
        tags: ['therapyTag1']
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
      therapy: {
        tags: ['therapyTag22']
      }
    }
    const res = await mutate({
      mutation: MY_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled therapy tags');
  });

  it('returns error if tags are not correct', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      therapy: {
        tags: ['therapyTag1, therapyTag2']
      }
    }
    const res = await mutate({
      mutation: MY_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled therapy tags');
  });

  it('tags only enabled', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      therapy: {
        tags: ['therapyTag3']
      }
    }
    const res = await mutate({
      mutation: MY_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled therapy tags');
  });

  it('returns full info requested', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      therapy: {
        tags: ['therapyTag1'],
        info: {date: '2021-01-02', time: TimeOfDay.Morning, notes: 'TEST NOTES'}
      }
    }

    const res = await mutate({
      mutation: MY_TRACK,
      variables
    });

    const record = await TherapyModel
      .findById(res.data.child.therapy.track.id);

    expect(record).toBeDefined();
    expect(record.tracked).toBeDefined()
    expect(record.time).toEqual(TimeOfDay.Morning)
    expect(record.date).toEqual('2021-01-02');
    expect(record.notes).toEqual('TEST NOTES');
    expect(record.child.toString()).toEqual(createdChildArr[0].id.toString());

    expect(res.errors).toBe(undefined);
    expect(res.data.child.therapy.track).toEqual(
      jasmine.objectContaining({
        id: record.id,
        therapy: {
          id: record.id,
          tracked: record.tracked.toISOString(),
          time: TimeOfDay.Morning,
          date: '2021-01-02',
          notes: 'TEST NOTES',
          tags: [
            {
              group: DefaultTagGroup,
              name: 'therapyTag1',
              type: TagTypeEnum.Therapy
            }
          ]
        }
      })
    );
  })

  it('should require at least one tag to be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      therapy: {
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
