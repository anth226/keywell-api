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

const CHILD_QUERY = gql`
    query Child($id: ID!) {
        child(id: $id) {
            id
            name
            age
        }
    }
`;

describe('child queries', () => {
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
      query: CHILD_QUERY,
      variables: {
        id: childrenCreated.id
      }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('should throw error if does not find other user\'s child', async () => {
    const token = await getToken(tokenPayloadUser2)
    const authorizationHeaderUser2 = {
      authorization: `Bearer ${token}`
    }
    const {query} = initServerWithHeaders(server, authorizationHeaderUser2)
    const res = await query({
      query: CHILD_QUERY,
      variables: {
        ...childrenData,
        id: childrenCreated.id
      }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child cannot found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('found child just created', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: CHILD_QUERY,
      variables: {
        id: childrenCreated.id
      }
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          ...childrenData,
          id: childrenCreated.id
        }
      }),
    )
  });

  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
});

const CHILD_DIAGNOSES_QUERY = gql`
    query ChildDiagnoses($id: ID!) {
        child(id: $id) {
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

describe('child.diagnosesResolver queries', () => {
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
      query: CHILD_DIAGNOSES_QUERY,
      variables: {
        id: childrenCreated.id
      }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });


  it('found empty diagnosesResolver of child', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const res = await query({
      query: CHILD_DIAGNOSES_QUERY,
      variables: {
        id: childrenCreated.id
      }
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          ...childrenData,
          id: childrenCreated.id,
          diagnoses: []
        }
      }),
    )
  });

  it('found diagnosis just added to child', async () => {
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
      query: CHILD_DIAGNOSES_QUERY,
      variables: {
        id: childrenCreated.id
      }
    })
    // remove assigned diagnoses
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses': []
      }
    })
    await DiagnosisModel.deleteOne({
      _id: diagnosisCreated.id
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          ...childrenData,
          id: childrenCreated.id,
          diagnoses: [
            {
              ...diagnosisData,
              id: diagnosisCreated.id,
            }
          ]
        }
      }),
    )
  });

  it('found multiple diagnosis just added to child', async () => {
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
      query: CHILD_DIAGNOSES_QUERY,
      variables: {
        id: childrenCreated.id
      }
    })
    // remove assigned diagnoses
    await ChildModel.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses': []
      }
    })
    // delete diagnosesResolver 2
    await DiagnosisModel.deleteMany({
      _id: [diagnosisCreated.id, diagnosisCreated2.id]
    })


    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
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
      }),
    )
  });

  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
});

const CHILD_MEDICATIONS_QUERY = gql`
    query ChildMedications($id: ID!) {
        child(id: $id) {
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

describe('child.medicationsResolver queries', () => {
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
    const variables = {
      id: childrenCreated.id
    }
    const res = await apolloServerClient.query({
      query: CHILD_MEDICATIONS_QUERY,
      variables
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });


  it('found empty medicationsResolver of child', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      id: childrenCreated.id
    }
    const res = await query({
      query: CHILD_MEDICATIONS_QUERY,
      variables
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          ...childrenData,
          id: childrenCreated.id,
          medications: []
        }
      }),
    )
  });

  it('found child medication just added to child', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create child-medication
    const medication = await MedicationModel.create({
      name: '_medication_name_'
    })
    const childMedication = await ChildMedicationModel.create({
      child: childrenCreated.id,
      medication: medication.id,
      days
    })

    const variables = {
      id: childrenCreated.id
    }
    const res = await query({
      query: CHILD_MEDICATIONS_QUERY,
      variables
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
        child: {
          ...childrenData,
          id: childrenCreated.id,
          medications: [
            {
              id: childMedication.id,
              days
            }
          ]
        }
      }),
    )
  });

  it('found child medication details just added to child', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // create child-medication
    const medication = await MedicationModel.create({
      name: '_medication_name_'
    })
    const childMedication = await ChildMedicationModel.create({
      child: childrenCreated.id,
      medication: medication.id,
      days
    })

    const variables = {
      id: childrenCreated.id
    }
    const res = await query({
      query: gql`
        query ChildMedications($id: ID!) {
          child(id: $id) {
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
      variables
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
        child: {
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
      }),
    )
  });

  it('found multiple child medication just added to children', async () => {
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

    const variables = {
      id: childrenCreated.id
    }
    const res = await query({
      query: CHILD_MEDICATIONS_QUERY,
      variables
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
        child: {
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
      }),
    )
  });

  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
})


const CHILD_SLEEP_SCHEDULE_QUERY = gql`
  query ChildSleepSchedule($id: ID!) {
    child(id: $id) {
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

describe('child.sleepScheduleResolver queries', () => {
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
    const variables = {
      id: childrenCreated.id
    }
    const res = await apolloServerClient.query({
      query: CHILD_SLEEP_SCHEDULE_QUERY,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });


  it('found empty sleepScheduleResolver of child', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      id: childrenCreated.id
    }
    const res = await query({
      query: CHILD_SLEEP_SCHEDULE_QUERY,
      variables,
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          ...childrenData,
          id: childrenCreated.id,
          sleepSchedule: []
        }
      }),
    )
  });

  it('found sleep schedule just added to child', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const sleepSchedule = await ChildSleepScheduleModel.create({
      child: childrenCreated.id,
      days
    })

    const variables = {
      id: childrenCreated.id
    }
    const res = await query({
      query: CHILD_SLEEP_SCHEDULE_QUERY,
      variables,
    })
    await ChildSleepScheduleModel.deleteOne({
      _id: sleepSchedule.id
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
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
      }),
    )
  })

  it('found multiple sleep schedule just added to child', async () => {
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

    const variables = {
      id: childrenCreated.id
    }
    const res = await query({
      query: gql`
        query ChildrenSleepSchedule($id: ID!) {
          child(id: $id) {
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
      variables,
    })
    await ChildSleepScheduleModel.deleteMany({
      _id: {
        $in: [sleepSchedule.id, sleepSchedule2.id]
      }
    })

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
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
      }),
    )
  })

  afterAll(async function () {
    await ChildModel.deleteOne({
      _id: childrenCreated.id
    })
  })
});
