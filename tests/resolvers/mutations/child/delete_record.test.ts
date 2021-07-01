import {gql} from 'apollo-server';
import server from '../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../createTestServer';
import {connectDB} from '../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2,} from '../../../helper';
import {getCurrentDateFormatted, getTimeOfDay, setCurrentDate} from '../../../../src/utils';
import {TagTypeEnum} from '../../../../src/types/schema.types';
import dayjs from 'dayjs';
import {TherapyModel, ChildModel, TagModel, UserModel, EventModel} from '../../../../src/db/models';
import {DefaultTagGroup, ITag} from '../../../../src/db/interfaces';

const apolloServerClient = createTestClient(server);

const DELETE_RECORD = gql`
    mutation deleteRecord($recordId: ID!) {
      child {
        deleteRecord(recordId: $recordId) {
          id
          deleted
        }
      }
    }
`;

describe('record delete mutation', () => {
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
      recordId: createdTherapyRecordAry[0].id,
    }
    const res = await apolloServerClient.mutate({
      mutation: DELETE_RECORD,
      variables
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('does not allow to edit a non-owner record', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      recordId: createdTherapyRecordAry[1].id,
    };
    const res = await mutate({
      mutation: DELETE_RECORD,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('delete a record successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      recordId: createdTherapyRecordAry[0].id,
    };
    const res = await mutate({
      mutation: DELETE_RECORD,
      variables,
    });

    expect(res.data.child.deleteRecord?.id).toBe(createdTherapyRecordAry[0].id)
    expect(res.data.child.deleteRecord?.deleted).toBe(true)

    // should check from db side
    const newRecord = await EventModel.findOne({
      _id: createdTherapyRecordAry[0].id,
    });
    expect(newRecord).toBe(null)

    const deletedRecords = await EventModel.aggregate([{$match: {isDeleted: true}}])
    expect(deletedRecords.length).toBe(1)
    expect(deletedRecords[0]._id.toString()).toBe(createdTherapyRecordAry[0].id.toString())
    expect(deletedRecords[0].isDeleted).toBe(true)
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
