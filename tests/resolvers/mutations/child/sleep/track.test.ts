import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {SleepModel, ChildModel, TagModel, UserModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper';
import {getTimeOfDay} from '../../../../../src/utils';
import {TagTypeEnum} from '../../../../../src/types/schema.types';
import {DefaultTagGroup, ITag} from '../../../../../src/db/interfaces';

const apolloServerClient = createTestClient(server);

const SLEEP_TRACK = gql`
    mutation SleepTrack($childId: ID!, $sleep: SleepRecordInput!) {
        child {
          sleep {
                track(childId: $childId, sleep: $sleep){
                    id
                    sleep {
                        id
                        tracked
                        date
                        time
                        notes
                        bedTime
                        wakeUpTime
                        incidents {
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

describe('sleep track mutations', () => {
  const bTagData = [
    {
      type: TagTypeEnum.Sleep,
      name: 'sleepTag1',
      group: DefaultTagGroup,
      order: 1
    },
    {
      type: TagTypeEnum.Sleep,
      name: 'sleepTag2',
      group: DefaultTagGroup,
      order: 2
    },
    {
      type: TagTypeEnum.Sleep,
      name: 'sleepTag3',
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
    userData[0].disabled_tags = [bTagCreatedArr[bTagCreatedArr.length - 1].id] // last tag sleepTag3 is disabled for current user
    createdUserArr = await UserModel.create(userData)
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: '05:00'
      }
    }
    const res = await apolloServerClient.mutate({
      mutation: SLEEP_TRACK,
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
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: '5:00'
      }
    }
    const res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toBe('Incorrect child id');
  });

  it('does not require date property to be defined', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: '5:00'
      }
    }
    const res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors).toBe(undefined);
    const sleep = res.data.child.sleep.track.sleep
    expect(sleep.time).toBe(getTimeOfDay())
    expect(sleep.date.length).toBeGreaterThan(0)
    await SleepModel.deleteOne({_id: sleep.id})
  });

  it('does not require date property but can be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const testDate = '2021-09-12'
    const variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: '05:00',
        date: testDate
      }
    }
    const res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors).toBe(undefined);
    const sleep = res.data.child.sleep.track.sleep
    expect(sleep.date).toBe(testDate)
    expect(sleep.time).toBe(getTimeOfDay())
    await SleepModel.deleteOne({_id: sleep.id})
  });

  it('returns bad_user_input error if child not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[1].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: '05:00'
      }
    }
    const res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toBe('Incorrect child id');
  });

  it('returns error if tags not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag11'],
        bedTime: '11:00',
        wakeUpTime: '05:00'
      }
    }
    const res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled sleep tags');
  });

  it('tags only enabled', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag3'],
        bedTime: '11:00',
        wakeUpTime: '05:00'
      }
    }
    const res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled sleep tags');
  });

  it('should require bedTime and wakeUpTime', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    let variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: ''
      }
    }
    let res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toEqual(
        'Variable "$sleep" got invalid value "" at "sleep.wakeUpTime"; Expected type "Time". Time format is invalid parsing'
      );

    variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '',
        wakeUpTime: '05:00'
      }
    }
    res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toEqual(
        'Variable "$sleep" got invalid value "" at "sleep.bedTime"; Expected type "Time". Time format is invalid parsing'
      );
  });

  it('should require corrent format of bedTime and wakeUpTime', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    let variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00:00',
        wakeUpTime: '05:00'
      }
    }
    let res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toEqual(
        'Variable "$sleep" got invalid value "11:00:00" at "sleep.bedTime"; Expected type "Time". Time format is invalid parsing'
      );

    variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: '30:00'
      }
    }
    res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toEqual(
        'Variable "$sleep" got invalid value "30:00" at "sleep.wakeUpTime"; Expected type "Time". Time format is invalid parsing'
      );
  });

  it('returns full info requested', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      childId: createdChildArr[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00',
        wakeUpTime: '05:00',
        date: '2021-01-02',
        notes: 'TEST NOTES'
      }
    }
    const res = await mutate({
      mutation: SLEEP_TRACK,
      variables
    });
    const record = await SleepModel.findById(res.data.child.sleep.track.id);

    expect(res.errors).toBe(undefined);
    expect(record).toBeDefined();
    expect(record.tracked).toBeDefined()
    expect(record.time).toEqual(getTimeOfDay())
    expect(record.date).toEqual('2021-01-02');
    expect(record.notes).toEqual('TEST NOTES');
    expect(record.bedTime).toEqual('11:00');
    expect(record.wakeUpTime).toEqual('05:00');
    expect(record.child.toString()).toEqual(createdChildArr[0].id.toString());

    expect(res.data.child.sleep.track).toEqual(
      jasmine.objectContaining({
        id: record.id,
        sleep: {
          id: record.id,
          tracked: record.tracked.toISOString(),
          time: getTimeOfDay(),
          date: '2021-01-02',
          notes: 'TEST NOTES',
          bedTime: '11:00',
          wakeUpTime: '05:00',
          incidents: [
            {
              group: DefaultTagGroup,
              name: 'sleepTag1',
              type: TagTypeEnum.Sleep
            }
          ]
        }
      })
    );
    await SleepModel.deleteOne({_id: record.id})
  })

  afterAll(async function () {
    const bTagIds = bTagCreatedArr.map(bt => bt.id)
    const childIds = createdChildArr.map(cd => cd.id)
    const userIds = createdUserArr.map(u => u.id)
    await TagModel.deleteMany({_id: {$in: bTagIds}})
    await ChildModel.deleteMany({_id: {$in: childIds}})
    await UserModel.deleteMany({_id: {$in: userIds}})
  })
});
