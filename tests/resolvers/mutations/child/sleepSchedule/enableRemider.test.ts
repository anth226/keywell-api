import {gql} from 'apollo-server';

import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {ChildModel, ChildSleepScheduleModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {encrypt} from '../../../../../src/tools/encryption';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper'
import {DayOfWeek} from '../../../../../src/types/schema.types';

const apolloServerClient = createTestClient(server);

const CHILD_SLEEP_SCHEDULE_ENABLE_REMINDER = gql`
  mutation EnableReminder($id: ID!, $enable: Boolean!) {
    child {
      sleep {
        schedule {
          enableReminder(id: $id, enabled: $enable) {
            id
            schedule {
              id
              sendReminder
              days
              bedTime {
                from
                to
              }
              wakeUpTime {
                from
                to
              }
            }
          }
        }
      }
    }
  }
`;

describe('childSleepSchedule.enableReminder mutation', () => {

  let childId: string
  let sleepScheduleId: string
  const sleepSchedulePayload = {
    bedTime: {
      from: '22:00',
      to: '23:00',
    },
    wakeUpTime: {
      from: '08:00',
      to: '09:00',
    },
    days: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday]
  }
 
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
      child: childId,
      ...sleepSchedulePayload,
    })
    sleepScheduleId = childSleepSchedule.id
  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.mutate({
        mutation: CHILD_SLEEP_SCHEDULE_ENABLE_REMINDER,
        variables: {
          id: sleepScheduleId,
          enable: true
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
        code: 'UNAUTHENTICATED'
    }));
  });

  it('should throw error if sleep schedule id is empty', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: CHILD_SLEEP_SCHEDULE_ENABLE_REMINDER,
        variables: {
          id: '   ',
          enable: true
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child sleep schedule Id cannot be empty');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if sleep schedule id is not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    // pre-generated id
    const id = '60cc66eb7b461caf0294b8d9'
    const res = await mutate({
        mutation: CHILD_SLEEP_SCHEDULE_ENABLE_REMINDER,
        variables: {
          id,
          enable: true
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child sleep schedule Id cannot be found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if child is not found', async () => {
    const nameEncrypted2 = await encrypt('_child_name_user2_')
    const child = await ChildModel.create({
      name: nameEncrypted2,
      age: 1,
      user: tokenPayloadUser2.id
    })
    const childSleepSchedule2 = await ChildSleepScheduleModel.create({
      child: child.id,
      ...sleepSchedulePayload,
    })
    
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: CHILD_SLEEP_SCHEDULE_ENABLE_REMINDER,
        variables: {
          id: childSleepSchedule2.id,
          enable: true
        }
    });
    await Promise.all([
      ChildSleepScheduleModel.deleteOne({_id: childSleepSchedule2.id}),
      ChildModel.deleteOne({_id: child.id})
    ])

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child cannot be found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should enable childMedicationId reminder successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: CHILD_SLEEP_SCHEDULE_ENABLE_REMINDER,
        variables: {
          id: sleepScheduleId,
          enable: true
        }
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          sleep: {
            schedule: {
              enableReminder: {
                id: sleepScheduleId,
                schedule: {
                  id: sleepScheduleId,
                  sendReminder: true,
                  ...sleepSchedulePayload
                }
              }
            },
          },
        },
      }),
    )
  });

  it('should disable childMedicationId reminder successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: CHILD_SLEEP_SCHEDULE_ENABLE_REMINDER,
        variables: {
          id: sleepScheduleId,
          enable: false
        }
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          sleep: {
            schedule: {
              enableReminder: {
                id: sleepScheduleId,
                schedule: {
                  id: sleepScheduleId,
                  sendReminder: false,
                  ...sleepSchedulePayload
                }
              }
            },
          },
        },     
      }),
    )
  });

  afterAll(async function(){
    
    await Promise.all([
      ChildModel.deleteOne({
        _id: childId
      }),
      ChildSleepScheduleModel.deleteOne({
        _id: sleepScheduleId
      }),
    ])
  })
})