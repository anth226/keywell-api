import {gql} from 'apollo-server';
import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../createTestServer'
import {ChildMedicationModel, ChildModel, ChildSleepScheduleModel, DiagnosisModel, MedicationModel} from '../../../src/db/models';
import {connectDB} from '../../../src/db';
import {authorizedHeaders, getToken, tokenPayload, tokenPayloadUser2} from '../../helper';
import {encrypt} from '../../../src/tools/encryption';
import {DayOfWeek} from '../../../src/types/schema.types';
import {IChild} from '../../../src/db/interfaces/child.interface';
import {IDiagnosis} from '../../../src/db/interfaces/diagnosis.interface';

const apolloServerClient = createTestClient(server);

const CHILDREN_QUERY = gql`
    query Children($sortBy: ChildrenSortInput) {
        children(sortBy: $sortBy) {
            id
        }
    }
`;

describe('children queries', () => {
  const childrenData = {
    name: '_child_name_',
    age: 1
  }
  let childrenCreated: IChild

  beforeAll(async function () {
    await connectDB()
    const nameEncrypted = await encrypt(childrenData.name);
    childrenCreated = await ChildModel.create({
      name: nameEncrypted,
      age: childrenData.age,
      user: tokenPayload.id
    })

  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: CHILDREN_QUERY,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('does not find other user\'s children ', async () => {
    const token = await getToken(tokenPayloadUser2)
    const authorizationHeaderUser2 = {
      authorization: `Bearer ${token}`
    }
    const {query} = initServerWithHeaders(server, authorizationHeaderUser2)
    const res = await query({
      query: CHILDREN_QUERY,
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: []
      }),
    )
  });

  it('found children just created', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: CHILDREN_QUERY,
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            id: childrenCreated.id
          }
        ]
      }),
    )
  });

  it('found multiple children just created', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // add second child
    const nameEncrypted = await encrypt(childrenData.name);
    const childCreated2 = await ChildModel.create({
      name: nameEncrypted,
      age: childrenData.age,
      user: tokenPayload.id
    })
    const childCreated2Id = childCreated2.id

    const res = await query({
      query: CHILDREN_QUERY,
    });

    // delete second child just created
    await ChildModel.deleteOne({
      _id: childCreated2Id
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            id: childrenCreated.id
          },
          {
            id: childCreated2Id
          },
        ]
      }),
    )
  });

  it('found multiple children just created ascending', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // add second child
    const nameEncrypted = await encrypt(childrenData.name);
    const childCreated2 = await ChildModel.create({
      name: nameEncrypted,
      age: childrenData.age,
      user: tokenPayload.id
    })
    const childCreated2Id = childCreated2.id

    const res = await query({
      query: CHILDREN_QUERY,
      variables: {
        sortBy: {
          createdAt: 'ASC'
        }
      }
    });

    // delete second child just created
    await ChildModel.deleteOne({
      _id: childCreated2Id
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            id: childrenCreated.id
          },
          {
            id: childCreated2Id
          },
        ]
      }),
    )
  });

  it('found multiple children just created descending', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // add second child
    const nameEncrypted = await encrypt(childrenData.name);
    const childCreated2 = await ChildModel.create({
      name: nameEncrypted,
      age: childrenData.age,
      user: tokenPayload.id
    })
    const childCreated2Id = childCreated2.id

    const res = await query({
      query: CHILDREN_QUERY,
      variables: {
        sortBy: {
          createdAt: 'DESC'
        }
      }
    });

    // delete second child just created
    await ChildModel.deleteOne({
      _id: childCreated2Id
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            id: childCreated2Id
          },
          {
            id: childrenCreated.id
          },
        ]
      }),
    )
  });

  it('found children just created full info requested', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: gql`
          query Children($sortBy: ChildrenSortInput) {
              children(sortBy: $sortBy) {
                  id
                  name
                  age
              }
          }
      `,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id
          }
        ]
      }),
    )
  });


  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
});

const CHILDREN_DIAGNOSES_QUERY = gql`
    query ChildrenDiagnoses($sortBy: ChildrenSortInput) {
        children(sortBy: $sortBy) {
            id
            name
            age
            diagnoses {
                id
                name
            }
        }
    }
`;

describe('children.diagnosesResolver queries', () => {
  const childrenData = {
    name: '_child_name_',
    age: 1
  }
  let childrenCreated: IChild
  const diagnosisData = {
    name: '_diagnosis_name_'
  }
  let diagnosisCreated: IDiagnosis

  beforeAll(async function () {
    await connectDB()
    // create child
    const nameEncrypted = await encrypt(childrenData.name);
    childrenCreated = await ChildModel.create({
      name: nameEncrypted,
      age: childrenData.age,
      user: tokenPayload.id
    })
  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: CHILDREN_DIAGNOSES_QUERY,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });


  it('found empty diagnosesResolver of children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: CHILDREN_DIAGNOSES_QUERY,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            diagnoses: []
          }
        ]
      }),
    )
  });

  it('found diagnosis just added to children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create diagnosis
    diagnosisCreated = await DiagnosisModel.create({
      ...diagnosisData,
      user: tokenPayload.id,
    });
    // assign diagnosis to child
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $push: {
        'diagnoses': diagnosisCreated.id
      }
    })

    const res = await query({
      query: CHILDREN_DIAGNOSES_QUERY,
    })

    await DiagnosisModel.deleteOne({
      _id: diagnosisCreated.id
    })

    // remove assigned diagnoses
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses': []
      }
    })


    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            diagnoses: [
              {
                ...diagnosisData,
                id: diagnosisCreated.id,
              }
            ]
          }
        ]
      }),
    )
  });

  it('found multiple diagnosis just added to children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create diagnosis
    diagnosisCreated = await DiagnosisModel.create({
      ...diagnosisData,
      user: tokenPayload.id,
    });
    // assign diagnosis to child
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $push: {
        'diagnoses': diagnosisCreated.id
      }
    })
    // second diagnosis
    const diagnosisData2 = {
      name: '__diagnosis__name__'
    }
    const diagnosisCreated2 = await DiagnosisModel.create({
      ...diagnosisData2,
      user: tokenPayload.id,
    });
    // assign diagnosis 2 to child
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $push: {
        'diagnoses': diagnosisCreated2.id
      }
    })


    const res = await query({
      query: CHILDREN_DIAGNOSES_QUERY,
    })


    // delete diagnosesResolver 2
    await DiagnosisModel.deleteMany({
      _id: [diagnosisCreated.id, diagnosisCreated2.id]
    })
    // remove assigned diagnoses
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses': []
      }
    })


    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            diagnoses: [
              {
                ...diagnosisData2,
                id: diagnosisCreated2.id,
              },
              {
                ...diagnosisData,
                id: diagnosisCreated.id,
              },
            ]
          }
        ]
      }),
    )
  });

  it('found multiple diagnosis just added to children with name ordered', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create diagnosis
    const nameOrder1st = 'AABHD'
    const nameOrder2nd = 'ACCB'
    const nameOrder3rd = 'ID'
    const [diagnosis1, diagnosis2, diagnosis3] = await DiagnosisModel.create([
      {
        name: nameOrder1st,
      },
      {
        name: nameOrder2nd,
      },
      {
        name: nameOrder3rd
      }
    ]);

    // assign diagnosis to child 1
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $push: {
        'diagnoses': [diagnosis2, diagnosis1, diagnosis3]
      }
    })

    const child2 = await ChildModel.create({
      name: await encrypt(childrenData.name),
      age: childrenData.age,
      user: tokenPayload.id,
    })
    // assign diagnosis to child 2 
    await ChildModel.findOneAndUpdate({
      _id: child2.id
    }, {
      $push: {
        'diagnoses': [diagnosis3, diagnosis2]
      }
    })


    const res = await query({
      query: CHILDREN_DIAGNOSES_QUERY,
    })


    // // delete diagnosesResolver 2
    await DiagnosisModel.deleteMany({
      _id: [diagnosis1.id, diagnosis2.id, diagnosis3.id]
    })
    // remove assigned diagnoses
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses': []
      }
    })
    await ChildModel.deleteOne({
      _id: child2.id
    })


    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            diagnoses: [
              {
                id: diagnosis1.id,
                name: nameOrder1st
              },
              {
                id: diagnosis2.id,
                name: nameOrder2nd
              },
              {
                id: diagnosis3.id,
                name: nameOrder3rd
              },
            ]
          },
          {
            ...childrenData,
            id: child2.id,
            diagnoses: [
              {
                id: diagnosis2.id,
                name: nameOrder2nd
              },
              {
                id: diagnosis3.id,
                name: nameOrder3rd
              },
            ]
          },
        ]
      }),
    )
  });

  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
});

const CHILDREN_MEDICATIONS_QUERY = gql`
    query ChildrenMedications($sortBy: ChildrenSortInput) {
        children(sortBy: $sortBy) {
            id
            name
            age
            medications {
                id
                days
            }
        }
    }
`;

describe('children.medicationsResolver queries', () => {
  const childrenData = {
    name: '_child_name_',
    age: 1
  }
  let childrenCreated: IChild
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]

  beforeAll(async function () {
    await connectDB()
    // create child
    const nameEncrypted = await encrypt(childrenData.name);
    childrenCreated = await ChildModel.create({
      name: nameEncrypted,
      age: childrenData.age,
      user: tokenPayload.id
    })
  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: CHILDREN_MEDICATIONS_QUERY,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });


  it('found empty medicationsResolver of children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: CHILDREN_MEDICATIONS_QUERY,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            medications: []
          }
        ]
      }),
    )
  });

  it('found children medication just added to children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create child-medication
    const medication = await MedicationModel.create({
      name: '_medication_name_'
    })
    const childMedication = await ChildMedicationModel.create({
      child: childrenCreated.id,
      medication: medication.id,
      days,
    })

    const res = await query({
      query: CHILDREN_MEDICATIONS_QUERY,
    })
    await Promise.all([
      MedicationModel.deleteOne({
        _id: medication.id
      }),
      ChildMedicationModel.deleteOne({
        _id: childMedication.id
      })
    ])

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            medications: [
              {
                id: childMedication.id,
                days
              }
            ]
          }
        ]
      }),
    )
  });

  it('found children medication details just added to children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create child-medication
    const medication = await MedicationModel.create({
      name: '_medication_name_'
    })
    const childMedication = await ChildMedicationModel.create({
      child: childrenCreated.id,
      medication: medication.id,
      days,
    })

    const res = await query({
      query: gql`
        query ChildrenMedications($sortBy: ChildrenSortInput) {
          children(sortBy: $sortBy) {
            id
            name
            age
            medications {
              id
              days
              medication {
                id
                name
                availableDoses
              }
            }
          }
        }
      `,
    })
    await Promise.all([
      MedicationModel.deleteOne({
        _id: medication.id
      }),
      ChildMedicationModel.deleteOne({
        _id: childMedication.id
      })
    ])

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            medications: [
              {
                id: childMedication.id,
                days,
                medication: {
                  id: medication.id,
                  name: medication.name,
                  availableDoses: []
                }
              }
            ]
          }
        ]
      }),
    )
  });

  it('found multiple children medication just added to children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create child-medication
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id,
    })
    const childMedication = await ChildMedicationModel.create({
      child: childrenCreated.id,
      medication: medication.id,
      days,
    })
    const medication2 = await MedicationModel.create({
      name: '_medication_name_2_',
      user: tokenPayload.id,
    })
    const childMedication2 = await ChildMedicationModel.create({
      child: childrenCreated.id,
      medication: medication.id,
      days,
    })

    const res = await query({
      query: CHILDREN_MEDICATIONS_QUERY,
    })
    await Promise.all([
      MedicationModel.deleteMany({
        _id: [medication.id, medication2.id]
      }),
      ChildMedicationModel.deleteMany({
        _id: [childMedication.id, childMedication2.id]
      })
    ])

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            medications: [
              {
                id: childMedication.id,
                days
              },
              {
                id: childMedication2.id,
                days
              },
            ]
          }
        ]
      }),
    )
  });

  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
});

const CHILDREN_SLEEP_SCHEDULE_QUERY = gql`
  query ChildrenSleepSchedule($sortBy: ChildrenSortInput) {
    children(sortBy: $sortBy) {
      id
      name
      age
      sleepSchedule {
        id
        sendReminder
        days
      }  
    }
  }
`;

describe('children.sleepScheduleResolver queries', () => {
  const childrenData = {
    name: '_child_name_',
    age: 1
  }
  let childrenCreated: IChild
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]

  beforeAll(async function () {
    await connectDB()
    // create child
    const nameEncrypted = await encrypt(childrenData.name);
    childrenCreated = await ChildModel.create({
      name: nameEncrypted,
      age: childrenData.age,
      user: tokenPayload.id
    })
  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: CHILDREN_SLEEP_SCHEDULE_QUERY,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });


  it('found empty sleepScheduleResolver of children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: CHILDREN_SLEEP_SCHEDULE_QUERY,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            sleepSchedule: []
          }
        ]
      }),
    )
  });

  it('found sleep schedule just added to children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const sleepSchedule = await ChildSleepScheduleModel.create({
      child: childrenCreated.id,
      days
    })

    const res = await query({
      query: CHILDREN_SLEEP_SCHEDULE_QUERY,
    })
    await ChildSleepScheduleModel.deleteOne({
      _id: sleepSchedule.id
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            sleepSchedule: [
              {
                id: sleepSchedule.id,
                days,
                sendReminder: false
              }
            ]
          }
        ]
      }),
    )
  })

  it('found multiple sleep schedule just added to children', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const timePayload = {
      bedTime: {
        from: '22:00',
        to: '23:00'
      },
      wakeUpTime: {
        from: '08:00',
        to: '09:00'
      }
    }
    const days1 = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
    const days2 = [DayOfWeek.Tuesday, DayOfWeek.Thursday, DayOfWeek.Saturday]
    const sleepSchedule = await ChildSleepScheduleModel.create({
      child: childrenCreated.id,
      days: days1,
      ...timePayload,
    })
    const sleepSchedule2 = await ChildSleepScheduleModel.create({
      child: childrenCreated.id,
      days: days2,
      sendReminder: true,
      ...timePayload,
    })

    const res = await query({
      query: gql`
        query ChildrenSleepSchedule($sortBy: ChildrenSortInput) {
          children(sortBy: $sortBy) {
            id
            name
            age
            sleepSchedule {
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
      `,
    })
    await ChildSleepScheduleModel.deleteMany({
      _id: {
        $in: [sleepSchedule.id, sleepSchedule2.id]
      }
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        children: [
          {
            ...childrenData,
            id: childrenCreated.id,
            sleepSchedule: [
              {
                id: sleepSchedule.id,
                days: days1,
                sendReminder: false,
                ...timePayload
              },
              {
                id: sleepSchedule2.id,
                days: days2,
                sendReminder: true,
                ...timePayload
              },

            ]
          }
        ]
      }),
    )
  })

  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
});