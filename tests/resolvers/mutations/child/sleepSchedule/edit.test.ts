import {gql} from 'apollo-server';

import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {ChildModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {encrypt} from '../../../../../src/tools/encryption';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper'
import {DayOfWeek, SleepScheduleInput} from '../../../../../src/types/schema.types';
import {ChildSleepScheduleModel} from '../../../../../src/db/models';

const apolloServerClient = createTestClient(server);

const EDIT_CHILD_SLEEP_SCHEDULE = gql`
  mutation AddChildSleepSchedule($id: ID!, $input: SleepScheduleUpdateInput!) {
    child {
      sleep {
        schedule {
          edit(id: $id, schedule: $input) {
            id
            schedule {
              bedTime {
                from
                to
              }
              wakeUpTime {
                from
                to
              }
              days
              sendReminder
            }
          }
        }
      }
    }
  }
`

describe('childSleepSchedule.edit mutation', () => {

  let childId: string
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
  const input: SleepScheduleInput = {
    bedTime: {
      from: '20:00',
      to: '21:00'
    },
    wakeUpTime: {
      from: '08:00',
      to: '08:30'
    },
    days
  }
  let childSleepScheduleId: string
 
  beforeAll(async function() {
    await connectDB()
    const nameEncrypted = await encrypt('_child_name_')
    const child = await ChildModel.create({
      name: nameEncrypted,
      age: 1,
      user: tokenPayload.id
    })
    childId = child.id
    const childSleepSchedule = await ChildSleepScheduleModel.create({
      child: child.id,
      sendReminder: true,
      ...input, 
    })
    childSleepScheduleId = childSleepSchedule.id
  });

  it('does not accept if not logged in', async () => {
   const res = await apolloServerClient.mutate({
        mutation: EDIT_CHILD_SLEEP_SCHEDULE,
        variables: {
          id: childSleepScheduleId,
          input,
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
        code: 'UNAUTHENTICATED'
    }));
  });

  it('should throw error if id is empty', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: EDIT_CHILD_SLEEP_SCHEDULE,
        variables: {
          id: '   ',
          input
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Cannot input empty childSleepScheduleId');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if id is not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: EDIT_CHILD_SLEEP_SCHEDULE,
        variables: {
          id: '60d3279b303aaefb9ac7e129', // pre-filled
          input
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child sleep schedule Id cannot be found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if childId is not belong to authenticated user', async () => {
    const nameEncrypted = await encrypt('_child_name_')
    const childId2 = await ChildModel.create({
      name: nameEncrypted,
      age: 1,
      user: tokenPayloadUser2.id
    })
    const childSleepSchedule2 = await ChildSleepScheduleModel.create({
      child: childId2.id,
      sendReminder: true,
      ...input, 
    })

    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: EDIT_CHILD_SLEEP_SCHEDULE,
        variables: {
          id: childSleepSchedule2.id,
          input
        }
    });

    await Promise.all([
      ChildModel.deleteOne({_id: childId2.id}),
      ChildSleepScheduleModel.deleteOne({_id: childSleepSchedule2.id})
    ])

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child cannot be found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should create sleep schedule success without duplication of days', async () => {
    const input: SleepScheduleInput = {
      bedTime: {
        from: '22:00',
        to: '23:00'
      },
      wakeUpTime: {
        from: '10:00',
        to: '11:30'
      },
      days: [DayOfWeek.Monday, DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Sunday]
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: EDIT_CHILD_SLEEP_SCHEDULE,
        variables: {
          id: childSleepScheduleId,
          input
        }
    });
    await ChildSleepScheduleModel.deleteOne({
      child: childSleepScheduleId,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          sleep: {
            schedule: {
              edit: {
                id: childSleepScheduleId,
                schedule: {
                  ...input,
                  days: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Sunday],
                  sendReminder: true,
                },
              },
            },
          },
        },
      }),
    )
  });

  afterAll(async function(){
    await Promise.all([
      ChildModel.deleteOne({
        _id: childId,
      }),
      ChildSleepScheduleModel.deleteMany()
    ])
  })

})