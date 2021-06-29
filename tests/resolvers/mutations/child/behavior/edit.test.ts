import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2,} from '../../../../helper';
import {getCurrentDateFormatted, getTimeOfDay, setCurrentDate} from '../../../../../src/utils';
import {TagTypeEnum, TimeOfDay} from '../../../../../src/types/schema.types';
import dayjs from 'dayjs';
import {IProtoTag} from '../../../../../src/db/interfaces/tag.interface';
import {ChildModel, TagModel, UserModel} from '../../../../../src/db/models';
import {BehaviorModel} from '../../../../../src/db/models/event.model';

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
                        date
                        notes
                        tags {
                            name
                            group
                            type
                        }
                        reaction {
                            feeling {
                                name
                                group
                                type
                            }
                            tags {
                                name
                                group
                                type
                            }
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
      type: TagTypeEnum.Behavior,
      name: 'behaviorTag1',
      group: 'DESIRABLE',
      order: 1,
    },
    {
      type: TagTypeEnum.Behavior,
      name: 'behaviorTag2',
      group: 'DESIRABLE',
      order: 1,
    },
    {
      type: TagTypeEnum.Behavior,
      name: 'behaviorTag3',
      group: 'DESIRABLE',
      order: 1,
    },
  ] as IProtoTag[];

  const childData = [
    {
      name: 'myChild1',
      age: 2,
      user: tokenPayload.id,
    },
    {
      name: 'myChild2',
      age: 3,
      user: tokenPayloadUser2.id,
    },
  ];

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

  let createdBehaviorTagsAry = [],
    createdChildrenAry = [],
    createdBehaviorRecordAry = [],
    createdUserArr = [];

  const currentDateTime = dayjs('2021-01-01 07:00').toDate()
  setCurrentDate(currentDateTime) // To avoid possible rare issues when running tests at the very end of time period
  const currentDateFormatted = getCurrentDateFormatted()
  const currentTimeOfDay = getTimeOfDay() // Morning

  beforeAll(async function () {
    await connectDB();
    createdBehaviorTagsAry = await TagModel.create(bTagData);
    createdChildrenAry = await ChildModel.create(childData);
    userData[0].disabled_tags = [createdBehaviorTagsAry[createdBehaviorTagsAry.length - 1].id] // last tag behaviorTag3 is disabled for current user
    createdUserArr = await UserModel.create(userData)

    const behaviorRecordData = [
      {
        tracked: currentDateTime,
        date: currentDateFormatted,
        time: currentTimeOfDay,
        tags: createdBehaviorTagsAry,
        reaction: null,
        child: createdChildrenAry[0].id,
      },
      {
        tracked: currentDateTime,
        date: currentDateFormatted,
        time: currentTimeOfDay,
        tags: createdBehaviorTagsAry,
        reaction: null,
        child: createdChildrenAry[1].id, // wrong user id for a test case
      },
    ];
    createdBehaviorRecordAry = await BehaviorModel.create(behaviorRecordData);
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {tags: ['behaviorTag1']},
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[1].id,
      behavior: {tags: ['behaviorTag1']},
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {tags: ['behaviorTag1']},
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const behavior = res.data.child.behavior.edit.behavior;
    expect(behavior.time).toBe(currentTimeOfDay);
  });

  it('does not require behavior:info property but can be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag1'],
        info: {date: testDate, time: TimeOfDay.Evening},
      },
    };
    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors).toBe(undefined);
    const behavior = res.data.child.behavior.edit.behavior
    expect(behavior.date).toBe(testDate);
    expect(behavior.time).toBe(TimeOfDay.Evening)

    // revert changes
    await BehaviorModel.updateOne({
      _id: createdBehaviorRecordAry[0].id
    }, {
      time: currentTimeOfDay,
      date: currentDateFormatted
    })
  });

  it('returns error if tags are disabled', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
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

  it('returns error if tags are not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag4'],
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
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

  it('update a behavior record successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const testDate = '2021-09-12';
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag1'],
        info: {date: testDate, time: TimeOfDay.Evening, notes: 'TEST NOTES'},
      },
    };

    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });

    expect(res.data.child.behavior.edit).toEqual(
      jasmine.objectContaining({
        id: createdBehaviorRecordAry[0].id,
        behavior: {
          id: createdBehaviorRecordAry[0].id,
          tracked: createdBehaviorRecordAry[0].tracked.toISOString(),
          time: TimeOfDay.Evening,
          date: testDate,
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

    // should check from db side
    const newBehaviorRecordId = res.data.child.behavior.edit.behavior?.id;
    const newBehaviorRecord = await BehaviorModel.findOne({
      _id: newBehaviorRecordId,
    });

    expect(res.errors).toBe(undefined);
    expect(newBehaviorRecord.time).toBe(TimeOfDay.Evening);
    expect(newBehaviorRecord.date).toBe(testDate);
    expect(newBehaviorRecord.notes).toBe('TEST NOTES');

    // revert changes
    await BehaviorModel.updateOne({
      _id: createdBehaviorRecordAry[0].id
    }, {
      time: currentTimeOfDay,
      date: currentDateFormatted,
      notes: null
    })
  });

  it('should require at least one tag to be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: []
      },
    };

    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toEqual('At least one tag is expected');
  });

  it('should not update date and time if none were provided', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      id: createdBehaviorRecordAry[0].id,
      behavior: {
        tags: ['behaviorTag1']
      },
    };

    setCurrentDate(dayjs().add(36, 'hours').toDate());

    const res = await mutate({
      mutation: EDIT_TRACK,
      variables,
    });

    setCurrentDate(null);

    const recordId = createdBehaviorRecordAry[0].id;

    expect(res.errors).toBeUndefined();
    expect(res.data.child.behavior.edit).toEqual(
      jasmine.objectContaining({
        id: recordId,
        behavior: {
          id: recordId,
          tracked: createdBehaviorRecordAry[0].tracked.toISOString(),
          time: currentTimeOfDay,
          date: currentDateFormatted,
          notes: null,
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

    const record = await BehaviorModel.findOne({
      _id: recordId,
    });

    expect(record.time).toBe(currentTimeOfDay);
    expect(record.date).toBe(currentDateFormatted);
  });

  afterAll(async function () {
    const bTagIds = createdBehaviorTagsAry.map((bt) => bt.id);
    const childIds = createdChildrenAry.map((cd) => cd.id);
    const behaviorRecordIds = createdBehaviorRecordAry.map((br) => br.id);
    const userIds = createdUserArr.map(u => u.id)
    await TagModel.deleteMany({_id: {$in: bTagIds}});
    await ChildModel.deleteMany({_id: {$in: childIds}});
    await BehaviorModel.deleteMany({_id: {$in: behaviorRecordIds}});
    await UserModel.deleteMany({_id: {$in: userIds}})
  });
});
