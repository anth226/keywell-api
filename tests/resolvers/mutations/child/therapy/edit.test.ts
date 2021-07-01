import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2,} from '../../../../helper';
import {getCurrentDateFormatted, getTimeOfDay, setCurrentDate} from '../../../../../src/utils';
import {TagTypeEnum, TimeOfDay} from '../../../../../src/types/schema.types';
import dayjs from 'dayjs';
import {TherapyModel, ChildModel, TagModel, UserModel} from '../../../../../src/db/models';
import {DefaultTagGroup, ITag} from '../../../../../src/db/interfaces';

const apolloServerClient = createTestClient(server);

const EDIT_TRACK = gql`
    mutation EditTrack($id: ID!, $therapy: TherapyRecordInput!) {
        child {
          therapy {
                edit(id: $id, therapy: $therapy) {
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

describe('therapy edit mutation', () => {
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
   createdTherapyRecordAry = [],
   createdUserArr = [],
   createdChildArr = []
   
  const currentDateTime = dayjs('2021-01-01 07:00').toDate()
  setCurrentDate(currentDateTime) // To avoid possible rare issues when running tests at the very end of time period
  const currentDateFormatted = getCurrentDateFormatted()
  const currentTimeOfDay = getTimeOfDay() // Morning
  
  beforeAll(async function () {
    await connectDB()
    bTagCreatedArr = await TagModel.create(bTagData)
    userData[0].disabled_tags = [bTagCreatedArr[bTagCreatedArr.length - 1].id] // last tag therapyTag3 is disabled for current user
    createdUserArr = await UserModel.create(userData)
    createdChildArr = await ChildModel.create(childData)

    const therapyRecordData = [
      {
        tracked: currentDateTime,
        date: currentDateFormatted,
        time: currentTimeOfDay,
        tags: bTagCreatedArr,
        notes: '',
        child: createdChildArr[0].id,
      },
      {
        tracked: currentDateTime,
        date: currentDateFormatted,
        time: currentTimeOfDay,
        tags: bTagCreatedArr,
        notes: '',
        child: createdChildArr[1].id, // wrong user id for a test case
      },
    ];
    createdTherapyRecordAry = await TherapyModel.create(therapyRecordData);
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      id: createdTherapyRecordAry[0].id,
      therapy: {tags: ['therapyTag1']}
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

  it('does not allow to edit a non-owner therapy record', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdTherapyRecordAry[1].id,
      therapy: {tags: ['therapyTag1']},
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

  it('does not require therapy:info property to be defined', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdTherapyRecordAry[0].id,
      therapy: {tags: ['therapyTag1']},
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const therapy = res.data.child.therapy.edit.therapy;
    expect(therapy.time).toBe(createdTherapyRecordAry[0].time);
  });

  it('does not require therapy:info property but can be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdTherapyRecordAry[0].id,
      therapy: {
        tags: ['therapyTag1'],
        info: {date: testDate, time: TimeOfDay.Evening},
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const therapy = res.data.child.therapy.edit.therapy
    expect(therapy.date).toBe(testDate);
    expect(therapy.time).toBe(TimeOfDay.Evening)

    // revert changes
    await TherapyModel.updateOne({
      _id: createdTherapyRecordAry[0].id
    }, {
      time: currentTimeOfDay,
      date: currentDateFormatted
    })
  });

  it('returns error if tags are empty', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdTherapyRecordAry[0].id,
      therapy: {
        tags: [],
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('At least one tag is expected');
  });

  it('returns error if tags are disabled', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdTherapyRecordAry[0].id,
      therapy: {
        tags: ['therapyTag3'],
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled therapy tags');
  });

  it('returns error if tags are not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdTherapyRecordAry[0].id,
      therapy: {
        tags: ['therapyTag4'],
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toBe('Invalid or disabled therapy tags');
  });

  it('update a therapy record successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdTherapyRecordAry[0].id,
      therapy: {
        tags: ['therapyTag1'],
        info: {date: testDate, time: TimeOfDay.Evening, notes: 'TEST NOTES'},
      },
    };

    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });

    expect(res.data.child.therapy.edit).toEqual(
      jasmine.objectContaining({
        id: createdTherapyRecordAry[0].id,
        therapy: {
          id: createdTherapyRecordAry[0].id,
          tracked: createdTherapyRecordAry[0].tracked.toISOString(),
          time: TimeOfDay.Evening,
          date: testDate,
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

    // should check from db side
    const newTherapyRecordId = res.data.child.therapy.edit.therapy?.id;
    const newTherapyRecord = await TherapyModel.findOne({
      _id: newTherapyRecordId,
    });

    expect(res.errors).toBe(undefined);
    expect(newTherapyRecord.time).toBe(TimeOfDay.Evening);
    expect(newTherapyRecord.date).toBe(testDate);
    expect(newTherapyRecord.notes).toBe('TEST NOTES');

    // revert changes
    await TherapyModel.updateOne({
      _id: createdTherapyRecordAry[0].id
    }, {
      time: currentTimeOfDay,
      date: currentDateFormatted,
      notes: ''
    })
  });

  afterAll(async function () {
    const bTagIds = bTagCreatedArr.map((bt) => bt.id);
    const childIds = createdChildArr.map((cd) => cd.id);
    const therapyRecordIds = createdTherapyRecordAry.map((br) => br.id);
    const userIds = createdUserArr.map(u => u.id)
    await TagModel.deleteMany({_id: {$in: bTagIds}});
    await ChildModel.deleteMany({_id: {$in: childIds}});
    await TherapyModel.deleteMany({_id: {$in: therapyRecordIds}});
    await UserModel.deleteMany({_id: {$in: userIds}})
  });
});
