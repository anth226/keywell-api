import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2,} from '../../../../helper';
import {getCurrentDateFormatted, getTimeOfDay, setCurrentDate} from '../../../../../src/utils';
import {TagTypeEnum} from '../../../../../src/types/schema.types';
import dayjs from 'dayjs';
import {SleepModel, ChildModel, TagModel, UserModel} from '../../../../../src/db/models';
import {DefaultTagGroup, ITag} from '../../../../../src/db/interfaces';

const apolloServerClient = createTestClient(server);

const EDIT_TRACK = gql`
  mutation EditTrack($id: ID!, $sleep: SleepRecordInput!) {
    child {
      sleep {
        editRecord(id: $id, sleep: $sleep) {
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

describe('sleep edit mutation', () => {
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

  let bTagCreatedArr = [],
   createdSleepRecordAry = [],
   createdUserArr = [],
   createdChildArr = []
   
  const currentDateTime = dayjs('2021-01-01 07:00').toDate()
  setCurrentDate(currentDateTime) // To avoid possible rare issues when running tests at the very end of time period
  const currentDateFormatted = getCurrentDateFormatted()
  const currentTimeOfDay = getTimeOfDay() // Morning
  const orgBedTime = '10:00', orgWakeUpTime = '04:00';
  const newBedTime = '11:00', newWakeUpTime = '05:00';
  
  beforeAll(async function () {
    await connectDB()
    bTagCreatedArr = await TagModel.create(bTagData)
    userData[0].disabled_tags = [bTagCreatedArr[bTagCreatedArr.length - 1].id] // last tag sleepTag3 is disabled for current user
    createdUserArr = await UserModel.create(userData)
    createdChildArr = await ChildModel.create(childData)

    const sleepRecordData = [
      {
        tracked: currentDateTime,
        date: currentDateFormatted,
        time: currentTimeOfDay,
        bedTime: orgBedTime,
        wakeUpTime: orgWakeUpTime,
        incidents: bTagCreatedArr,
        notes: '',
        child: createdChildArr[0].id,
      },
      {
        tracked: currentDateTime,
        date: currentDateFormatted,
        time: currentTimeOfDay,
        bedTime: orgBedTime,
        wakeUpTime: orgWakeUpTime,
        incidents: bTagCreatedArr,
        notes: '',
        child: createdChildArr[1].id, // wrong user id for a test case
      },
    ];
    createdSleepRecordAry = await SleepModel.create(sleepRecordData);
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime
      }
    }
    const res = await apolloServerClient.mutate({
      mutation: EDIT_TRACK,
      variables
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('does not allow to edit a non-owner sleep record', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdSleepRecordAry[1].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime
      }
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

  it('does not require sleep:date property to be defined', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime
      }
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const sleep = res.data.child.sleep.editRecord.sleep;
    expect(sleep.date.length).toBeGreaterThan(0);
  });

  it('does not require sleep:date property but can be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdSleepRecordAry[0].id,
      sleep: {
        date: testDate,
        incidents: ['sleepTag1'],
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime
      }
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const sleep = res.data.child.sleep.editRecord.sleep
    expect(sleep.date).toBe(testDate);

    // revert changes
    await SleepModel.updateOne({
      _id: createdSleepRecordAry[0].id
    }, {
      date: currentDateFormatted
    })
  });

  it('returns error if tags are disabled', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag3'],
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime
      }
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled sleep tags');
  });

  it('returns error if tags are not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag4'],
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime
      }
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled sleep tags');
  });

  it('should require bedTime and wakeUpTime', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    let variables = {
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: newBedTime,
        wakeUpTime: ''
      }
    }
    let res = await mutate({
      mutation: EDIT_TRACK,
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
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '',
        wakeUpTime: newWakeUpTime
      }
    }
    res = await mutate({
      mutation: EDIT_TRACK,
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
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: '11:00:00',
        wakeUpTime: newWakeUpTime
      }
    }
    let res = await mutate({
      mutation: EDIT_TRACK,
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
      id: createdSleepRecordAry[0].id,
      sleep: {
        incidents: ['sleepTag1'],
        bedTime: newBedTime,
        wakeUpTime: '30:00'
      }
    }
    res = await mutate({
      mutation: EDIT_TRACK,
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

  it('update a sleep record successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdSleepRecordAry[0].id,
      sleep: {
        date: testDate,
        incidents: ['sleepTag1'],
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime,
        notes: 'TEST NOTES'
      }
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });

    expect(res.data.child.sleep.editRecord).toEqual(
      jasmine.objectContaining({
        id: createdSleepRecordAry[0].id,
        sleep: {
          id: createdSleepRecordAry[0].id,
          tracked: createdSleepRecordAry[0].tracked.toISOString(),
          time: currentTimeOfDay,
          date: testDate,
          notes: 'TEST NOTES',
          bedTime: newBedTime,
          wakeUpTime: newWakeUpTime,
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

    // should check from db side
    const newsleepRecordId = res.data.child.sleep.editRecord.sleep?.id;
    const newsleepRecord = await SleepModel.findOne({
      _id: newsleepRecordId,
    });

    expect(res.errors).toBe(undefined);
    expect(newsleepRecord.time).toBe(currentTimeOfDay);
    expect(newsleepRecord.date).toBe(testDate);
    expect(newsleepRecord.notes).toBe('TEST NOTES');
    expect(newsleepRecord.bedTime).toBe(newBedTime);
    expect(newsleepRecord.wakeUpTime).toBe(newWakeUpTime);

    // revert changes
    await SleepModel.updateOne({
      _id: createdSleepRecordAry[0].id
    }, {
      time: currentTimeOfDay,
      date: currentDateFormatted,
      notes: '',
      bedTime: orgBedTime,
      wakeUpTime: orgWakeUpTime
    })
  });

  afterAll(async function () {
    const bTagIds = bTagCreatedArr.map((bt) => bt.id);
    const childIds = createdChildArr.map((cd) => cd.id);
    const sleepRecordIds = createdSleepRecordAry.map((br) => br.id);
    const userIds = createdUserArr.map(u => u.id)
    await TagModel.deleteMany({_id: {$in: bTagIds}});
    await ChildModel.deleteMany({_id: {$in: childIds}});
    await SleepModel.deleteMany({_id: {$in: sleepRecordIds}});
    await UserModel.deleteMany({_id: {$in: userIds}})
  });
});
