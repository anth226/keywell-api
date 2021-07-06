import {gql} from 'apollo-server'

import server from '../../../src/server'
import {createTestClient} from 'apollo-server-testing'
import {initServerWithHeaders} from '../../createTestServer'
import {connectDB} from '../../../src/db'
import {authorizedHeaders, tokenPayload} from '../../helper'
import {DayOfWeek, TagTypeEnum} from '../../../src/types/schema.types'
import {ActivityModel, BehaviorModel, ChildMedicationModel, ChildModel, MedicationModel, MedicationRecordModel, SleepModel, TagModel, TherapyModel} from '../../../src/db/models'
import {IProtoTag} from '../../../src/db/interfaces/tag.interface';
import {encrypt} from '../../../src/tools/encryption'
import {getCurrentDateFormatted, getTimeOfDay} from '../../../src/utils'

const apolloServerClient = createTestClient(server)

const TIMELINE_QUERY = gql`
  query TimelineQuery($from: Date, $to: Date) {
    timeline(from: $from, to: $to) {
      from
      to
      hasEventsAfter
      hasEventsBefore
      events {
        id
        date
        time
        notes
        # __typename
        ... on SleepRecord {
          bedTime
          wakeUpTime
          incidents {
            name
            group
            type
          }
          __typename
        }
        ... on MedicationRecord {
          medication {
            id
            dose
            doseAmount
            days
            medication {
              id
              name
            }
          }
          __typename
        }
        ... on TherapyRecord {
          tags {
            name
            group
            type
          }
          __typename
        }
        ... on ActivityRecord {
          tags {
            name
            group
            type
          }
          __typename
        }
        ... on BehaviorRecord {
          tags {
            name
            group
            type
          }
          reaction {
            tags {
              name
              group
              type
            }
            feelings {
              name
              group
              type
            }
          }
          __typename
        }
      }
    }
  }
`

const behaviorDesirable: IProtoTag[] = [
  'confidence',
  'cooperation',
  'flexibility',
].map((name) => ({
  type: TagTypeEnum.Behavior,
  group: 'Desirable',
  name,
  order: 0,
}))

const behaviorUndesirable: IProtoTag[] = [
  'aggression',
  'anxiety',
  'compulsions',
].map((name) => ({
  type: TagTypeEnum.Behavior,
  group: 'Undesirable',
  name,
  order: 0,
}))

const activityLearning: IProtoTag[] = [
  'homework',
  'interest classes',
  'school'
].map((name) => ({
  type: TagTypeEnum.Activity,
  group: 'Learning',
  name,
  order: 0,
}))

const reactionDefault: IProtoTag[] = [
  'bribed',
  'distracted',
  'enforced my will',
].map((name) => ({
  type: TagTypeEnum.Reaction,
  group: 'default',
  name,
  order: 0,
}))

const feelingDefault: IProtoTag[] = [
  'aggressive',
  'angry',
  'bored',
].map((name) => ({
  type: TagTypeEnum.Feeling,
  group: 'default',
  name,
  order: 0,
}))

const sleepDefault: IProtoTag[] = [
  'insomnia',
  'interrupted sleep',
  'night terrors',
].map((name) => ({
  type: TagTypeEnum.Sleep,
  group: 'default',
  name,
  order: 0,
}))

describe('timeline queries', () => {
  const childData = {
    name: '_child_name_',
    age: 1
  }
  let childId
  beforeAll(async function () {
    await connectDB()
    await TagModel.create([
      ...behaviorDesirable,
      ...behaviorUndesirable,
      ...activityLearning,
      ...reactionDefault,
      ...feelingDefault,
      ...sleepDefault,
    ])
    const nameEncrypted = await encrypt(childData.name);
    const childCreated = await ChildModel.create({
      name: nameEncrypted,
      age: childData.age,
      user: tokenPayload.id
    })
    childId = childCreated.id

  })

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: TIMELINE_QUERY,
    })

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      }),
    )
  })

  it('should get empty events', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TIMELINE_QUERY,
    })

    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        timeline: {
          from: null,
          to: null,
          hasEventsAfter: null,
          hasEventsBefore: null,
          events: []
        }
      })
    )
  })

  it('should get behavior record successfully', async () => {
    const d = new Date()
    const notes = 'behavior notes'
    const behaviorTag = await TagModel.findOne({
      name: behaviorDesirable[0].name,
      type: TagTypeEnum.Behavior
    })
    const record = await BehaviorModel.create({
      tracked: d,
      date: getCurrentDateFormatted(),
      time: getTimeOfDay(),
      notes,
      tags: [behaviorTag.id],
      child: childId
    });

    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TIMELINE_QUERY,
    })
    await BehaviorModel.deleteOne({_id: record.id})

    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        timeline: {
          from: null,
          to: null,
          hasEventsAfter: null,
          hasEventsBefore: null,
          events: [{
            id: record.id,
            date: getCurrentDateFormatted(),
            time: getTimeOfDay(),
            notes,
            tags: [{
              name: behaviorTag.name,
              group: behaviorTag.group,
              type: TagTypeEnum.Behavior,
            }],
            reaction: {
              tags: [],
              feelings: []
            },
            __typename: 'BehaviorRecord'
          }]
        }
      })
    )
  })

  it('should get activity record successfully', async () => {
    const d = new Date()
    const notes = 'activity notes'
    const activityTag = await TagModel.findOne({
      name: activityLearning[0].name,
      type: TagTypeEnum.Activity
    })
    const record = await ActivityModel.create({
      tracked: d,
      date: getCurrentDateFormatted(),
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
  
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TIMELINE_QUERY,
    })
    await ActivityModel.deleteOne({_id: record.id})
  
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        timeline: {
          from: null,
          to: null,
          hasEventsAfter: null,
          hasEventsBefore: null,
          events: [{
            id: record.id,
            date: getCurrentDateFormatted(),
            time: getTimeOfDay(),
            notes,
            tags: [{
              name: activityTag.name,
              group: activityTag.group,
              type: TagTypeEnum.Activity,
            }],
            __typename: 'ActivityRecord'
          }]
        }
      })
    )
  })

  it('should get medication record successfully', async () => {
    const d = new Date()
    const notes = 'medication notes'
    const medication = await MedicationModel.create({
      name: '_medication_name_'
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Tuesday]
    const childMedication = await ChildMedicationModel.create({
      child: childId,
      medication: medication.id,
      dose: '2mg',
      doseAmount: 5,
      days
    })

    const record = await MedicationRecordModel.create({
      tracked: d,
      date: getCurrentDateFormatted(),
      time: getTimeOfDay(),
      notes,
      child: childId,
      childMedication: childMedication.id
    });
  
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TIMELINE_QUERY,
    })
    await Promise.all([
      MedicationRecordModel.deleteOne({_id: record.id}),
      ActivityModel.deleteOne({_id: record.id}),
      ChildMedicationModel.deleteOne({_id: childMedication.id}),
      MedicationModel.deleteOne({_id: medication.id}),
    ])
  
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        timeline: {
          from: null,
          to: null,
          hasEventsAfter: null,
          hasEventsBefore: null,
          events: [{
            id: record.id,
            date: getCurrentDateFormatted(),
            time: getTimeOfDay(),
            notes,
            medication: {
              id: childMedication.id,
              dose: '2mg',
              doseAmount: 5,
              days,
              medication: {
                id: medication.id,
                name: '_medication_name_'
              }
            },
            __typename: 'MedicationRecord'
          }]
        }
      })
    )
  })

  it('should get activity record "from" filter successfully', async () => {
    const d = new Date()
    const notes = 'activity notes'
    const activityTag = await TagModel.findOne({
      name: activityLearning[0].name,
      type: TagTypeEnum.Activity
    })
    const from = '2021-06-28'
    const record1 = await ActivityModel.create({
      tracked: d,
      date: '2021-06-27',
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
    const record2 = await ActivityModel.create({
      tracked: d,
      date: '2021-06-28',
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
    const record3 = await ActivityModel.create({
      tracked: d,
      date: '2021-07-04',
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
  
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TIMELINE_QUERY,
      variables: {
        from
      }
    })
    await Promise.all([
      ActivityModel.deleteOne({_id: record1.id}),
      ActivityModel.deleteOne({_id: record2.id}),
      ActivityModel.deleteOne({_id: record3.id}),
    ])
  
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        timeline: {
          from,
          to: null,
          hasEventsAfter: null,
          hasEventsBefore: true,
          events: [
            {
              id: record2.id,
              date: '2021-06-28',
              time: getTimeOfDay(),
              notes,
              tags: [{
                name: activityTag.name,
                group: activityTag.group,
                type: TagTypeEnum.Activity,
              }],
              __typename: 'ActivityRecord'
            },
            {
              id: record3.id,
              date: '2021-07-04',
              time: getTimeOfDay(),
              notes,
              tags: [{
                name: activityTag.name,
                group: activityTag.group,
                type: TagTypeEnum.Activity,
              }],
              __typename: 'ActivityRecord'
            }
          ]
        }
      })
    )
  })

  it('should get activity record "to" filter successfully', async () => {
    const d = new Date()
    const notes = 'activity notes'
    const activityTag = await TagModel.findOne({
      name: activityLearning[0].name,
      type: TagTypeEnum.Activity
    })
    const to = '2021-06-28'
    const record1 = await ActivityModel.create({
      tracked: d,
      date: '2021-06-27',
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
    const record2 = await ActivityModel.create({
      tracked: d,
      date: '2021-06-28',
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
    const record3 = await ActivityModel.create({
      tracked: d,
      date: '2021-07-04',
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
  
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TIMELINE_QUERY,
      variables: {
        to
      }
    })
    await Promise.all([
      ActivityModel.deleteOne({_id: record1.id}),
      ActivityModel.deleteOne({_id: record2.id}),
      ActivityModel.deleteOne({_id: record3.id}),
    ])
  
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        timeline: {
          from: null,
          to,
          hasEventsAfter: true,
          hasEventsBefore: null,
          events: [
            {
              id: record1.id,
              date: '2021-06-27',
              time: getTimeOfDay(),
              notes,
              tags: [{
                name: activityTag.name,
                group: activityTag.group,
                type: TagTypeEnum.Activity,
              }],
              __typename: 'ActivityRecord'
            },
            {
              id: record2.id,
              date: '2021-06-28',
              time: getTimeOfDay(),
              notes,
              tags: [{
                name: activityTag.name,
                group: activityTag.group,
                type: TagTypeEnum.Activity,
              }],
              __typename: 'ActivityRecord'
            }
          ]
        }
      })
    )
  })

  it('should get all records type date ordered successfully', async () => {
    const d = new Date()
    // medication record
    const notes = 'medication notes'
    const medication = await MedicationModel.create({
      name: '_medication_name_'
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Tuesday]
    const childMedication = await ChildMedicationModel.create({
      child: childId,
      medication: medication.id,
      dose: '2mg',
      doseAmount: 5,
      days
    })
    const medicationRecord = await MedicationRecordModel.create({
      tracked: d,
      date: '2021-07-05',
      time: getTimeOfDay(),
      notes,
      child: childId,
      childMedication: childMedication.id
    });
    // behavior record
    const behaviorTag = await TagModel.findOne({
      name: behaviorDesirable[0].name,
      type: TagTypeEnum.Behavior
    })
    const behaviorRecord = await BehaviorModel.create({
      tracked: d,
      date: '2021-06-30',
      time: getTimeOfDay(),
      notes,
      tags: [behaviorTag.id],
      child: childId
    });
    // activity record
    const activityTag = await TagModel.findOne({
      name: activityLearning[0].name,
      type: TagTypeEnum.Activity
    })
    const activityRecord = await ActivityModel.create({
      tracked: d,
      date: '2021-06-29',
      time: getTimeOfDay(),
      notes,
      tags: [activityTag.id],
      child: childId
    });
    // therapy record
    const feelingTag = await TagModel.findOne({
      name: feelingDefault[0].name,
      type: TagTypeEnum.Feeling
    })
    const therapyRecord = await TherapyModel.create({
      tracked: d,
      date: '2021-06-28',
      time: getTimeOfDay(),
      notes,
      tags: [feelingTag.id],
      child: childId
    });
    // sleep record
    const sleepTag = await TagModel.findOne({
      name: sleepDefault[0].name,
      type: TagTypeEnum.Sleep
    })
    const bedTime = '11:00'
    const wakeUpTime = '05:00'
    const sleepRecord = await SleepModel.create({
      tracked: d,
      date: '2021-06-27',
      time: getTimeOfDay(),
      notes,
      bedTime,
      wakeUpTime,
      incidents: [sleepTag.id],
      child: childId
    });

  
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: TIMELINE_QUERY,
    })
    await Promise.all([
      MedicationRecordModel.deleteOne({_id: medicationRecord.id}),
      MedicationModel.deleteOne({_id: medication.id}),
      ChildMedicationModel.deleteOne({_id: childMedication.id}),
      BehaviorModel.deleteOne({_id: behaviorRecord.id}),
      ActivityModel.deleteOne({_id: activityRecord.id}),
      SleepModel.deleteOne({_id: sleepRecord.id}),
      TherapyModel.deleteOne({_id: therapyRecord.id}),
    ])
  
    expect(res.errors?.length).toBe(undefined)
    expect(res.data).toEqual(
      jasmine.objectContaining({
        timeline: {
          from: null,
          to: null,
          hasEventsAfter: null,
          hasEventsBefore: null,
          events: [
            {
              id: sleepRecord.id,
              date: '2021-06-27',
              time: getTimeOfDay(),
              notes,
              bedTime,
              wakeUpTime,
              incidents: [{
                name: sleepTag.name,
                group: sleepTag.group,
                type: TagTypeEnum.Sleep,
              }],
              __typename: 'SleepRecord'
            },
            {
              id: therapyRecord.id,
              date: '2021-06-28',
              time: getTimeOfDay(),
              notes,
              tags: [{
                name: feelingTag.name,
                group: feelingTag.group,
                type: TagTypeEnum.Feeling,
              }],
              __typename: 'TherapyRecord'
            },
            {
              id: activityRecord.id,
              date: '2021-06-29',
              time: getTimeOfDay(),
              notes,
              tags: [{
                name: activityTag.name,
                group: activityTag.group,
                type: TagTypeEnum.Activity,
              }],
              __typename: 'ActivityRecord'
            },
            {
              id: behaviorRecord.id,
              date: '2021-06-30',
              time: getTimeOfDay(),
              notes,
              tags: [{
                name: behaviorTag.name,
                group: behaviorTag.group,
                type: TagTypeEnum.Behavior,
              }],
              reaction: {
                tags: [],
                feelings: []
              },
              __typename: 'BehaviorRecord'
            },
            {
              id: medicationRecord.id,
              date: '2021-07-05',
              time: getTimeOfDay(),
              notes,
              medication: {
                id: childMedication.id,
                dose: '2mg',
                doseAmount: 5,
                days,
                medication: {
                  id: medication.id,
                  name: '_medication_name_'
                }
              },
              __typename: 'MedicationRecord'
            }
          ]
        }
      })
    )
  })

  afterAll(async function () {
    await ActivityModel.deleteMany()
    await TagModel.deleteMany()
    await ChildModel.deleteOne({_id: childId})
  })
})
