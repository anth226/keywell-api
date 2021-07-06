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

const ADD_CHILD_SLEEP_SCHEDULE = gql`
  mutation AddChildSleepSchedule($childId: ID!, $input: SleepScheduleInput!) {
    child {
      sleep {
        schedule {
          add(childId: $childId, schedule: $input) {
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

describe('childSleepSchedule.add mutation', () => {

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
 
  beforeAll(async function() {
    await connectDB()
    const nameEncrypted = await encrypt('_child_name_')
    const child = await ChildModel.create({
      name: nameEncrypted,
      age: 1,
      user: tokenPayload.id
    })
    childId = child.id
  });

  it('does not accept if not logged in', async () => {
   const res = await apolloServerClient.mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId,
          input,
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
        code: 'UNAUTHENTICATED'
    }));
  });

  it('should throw error if childId is empty', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId: '   ',
          input
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child must not be empty');
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId: childId2.id,
          input
        }
    });

    await ChildModel.deleteOne({_id: childId2.id})

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child is not exist');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if bedTime is not valid', async () => {
    const input: SleepScheduleInput = {
      bedTime: {
        from: '200:00',
        to: '21:00'
      },
      wakeUpTime: {
        from: '08:00',
        to: '08:30'
      },
      days
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId,
          input
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Variable "$input" got invalid value "200:00" at "input.bedTime.from"; Expected type "Time". Time format is invalid parsing');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if wakeUpTime is not valid', async () => {
    const input: SleepScheduleInput = {
      bedTime: {
        from: '20:00',
        to: '21:00'
      },
      wakeUpTime: {
        from: '08:00',
        to: '08:300'
      },
      days
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId,
          input
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Variable "$input" got invalid value "08:300" at "input.wakeUpTime.to"; Expected type "Time". Time format is invalid parsing');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if days input overlapping', async () => {
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
    const sleepSchedule = await ChildSleepScheduleModel.create({
      child: childId,
      ...input,
    })

    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId,
          input: {
            ...input,
            days: [DayOfWeek.Friday]
          }
        }
    });
    await ChildSleepScheduleModel.deleteOne({
      _id: sleepSchedule.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual(`Days overlapping ${JSON.stringify([DayOfWeek.Friday])}`);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'CONFLICT',
    }));
  });

  it('should create sleep schedule success without duplication of days', async () => {
    const input: SleepScheduleInput = {
      bedTime: {
        from: '20:00',
        to: '21:00'
      },
      wakeUpTime: {
        from: '08:00',
        to: '08:30'
      },
      days: [DayOfWeek.Monday, DayOfWeek.Monday, DayOfWeek.Tuesday]
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId,
          input
        }
    });
    const sleepSchedule = await ChildSleepScheduleModel.findOne({
      child: childId,
    })
    await ChildSleepScheduleModel.deleteOne({
      child: childId,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          sleep: {
            schedule: {
              add: {
                id: sleepSchedule.id,
                schedule: {
                  ...input,
                  days: [DayOfWeek.Monday, DayOfWeek.Tuesday],
                  sendReminder: false,
                },
              },
            },
          },
        },
      }),
    )
  });

  it('should create sleep schedule success without overlapping of days', async () => {
    const input: SleepScheduleInput = {
      bedTime: {
        from: '20:00',
        to: '21:00'
      },
      wakeUpTime: {
        from: '08:00',
        to: '08:30'
      },
      days: [DayOfWeek.Monday, DayOfWeek.Monday, DayOfWeek.Tuesday]
    }
    await ChildSleepScheduleModel.create({
      child: childId,
      ...input,
    })

    const days = [DayOfWeek.Wednesday, DayOfWeek.Thursday]
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_SLEEP_SCHEDULE,
        variables: {
          childId,
          input: {
            ...input,
            days
          }
        }
    });
    const sleepScheduleSecond = await ChildSleepScheduleModel.find({
      child: childId,
    }).sort({createdAt: -1})
    await ChildSleepScheduleModel.deleteMany({
      child: childId,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          sleep: {
            schedule: {
              add: {
                id: sleepScheduleSecond[0]?.id,
                schedule: {
                  ...input,
                  days,
                  sendReminder: false,
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