import {gql} from 'apollo-server';

import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import { initServerWithHeaders } from '../../createTestServer'
import { ChildMedication, Children, Diagnoses, IChildren, IDiagnosis, Medication } from '../../../src/db/models';
import { connectDB } from '../../../src/db';
import { authorizedHeaders, getToken, tokenPayload, tokenPayloadUser2 } from '../../helper';
import { encrypt } from '../../../src/tools/encryption';
import { DayOfWeek } from '../../../src/types/schema.types';

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

describe('child query', () => {
  const childrenData = {
    name: '_child_name_',
    age: 1
  }
  let childrenCreated: IChildren

  beforeAll(async function() {
    await connectDB()
    const nameEncrypted = await encrypt(childrenData.name);
    childrenCreated = await Children.create({
      name: nameEncrypted,
      age: childrenData.age,
      user_id: tokenPayload.id
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
    const { query } = initServerWithHeaders(server, authorizationHeaderUser2)
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
      const { query } = initServerWithHeaders(server, authorizedHeaders)
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

  afterAll(async function(){
    await Children.deleteOne({
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

describe('chil.diagnoses query', () => {
  const childrenData = {
    name: '_child_name_',
    age: 1
  }
  let childrenCreated: IChildren
  const diagnosisData = {
    name: '_diagnosis_name_'
  }
  let diagnosisCreated: IDiagnosis

  beforeAll(async function() {
    await connectDB()
    // create child
    const nameEncrypted = await encrypt(childrenData.name);
    childrenCreated = await Children.create({
      name: nameEncrypted,
      age: childrenData.age,
      user_id: tokenPayload.id
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


  it('found empty diagnoses of child', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
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
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    // create diagnosis
    diagnosisCreated = await Diagnoses.create({
      ...diagnosisData,
      user_id: tokenPayload.id,
    });
    // assign diagnosis to child
    await Children.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $push: {
        'diagnoses_id': diagnosisCreated.id
      }
    })
    
    const res = await query({
      query: CHILD_DIAGNOSES_QUERY,
      variables: {
        id: childrenCreated.id
      }
    })
    // remove assigned diagnoses_id
    await Children.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses_id': []
      }
    })
    await Diagnoses.deleteOne({
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
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    // create diagnosis
    diagnosisCreated = await Diagnoses.create({
      ...diagnosisData,
      user_id: tokenPayload.id,
    });
    // assign diagnosis to child
    await Children.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $push: {
        'diagnoses_id': diagnosisCreated.id
      }
    })
    // second diagnosis
    const diagnosisData2 = {
      name: '__diagnosis__name__'
    }
    const diagnosisCreated2 = await Diagnoses.create({
      ...diagnosisData2,
      user_id: tokenPayload.id,
    });
    // assign diagnosis 2 to child
    await Children.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $push: {
        'diagnoses_id': diagnosisCreated2.id
      }
    })

    
    const res = await query({
      query: CHILD_DIAGNOSES_QUERY,
      variables: {
        id: childrenCreated.id
      }
    })
    // remove assigned diagnoses_id
    await Children.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses_id': []
      }
    })
    // delete diagnoses 2
    await Diagnoses.deleteMany({
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

  afterAll(async function(){
    await Children.deleteOne({
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

describe('child.medications query', () => {
  const childrenData = {
    name: '_child_name_',
    age: 1
  }
  let childrenCreated: IChildren
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]

  beforeAll(async function() {
    await connectDB()
    // create child
    const nameEncrypted = await encrypt(childrenData.name);
    childrenCreated = await Children.create({
      name: nameEncrypted,
      age: childrenData.age,
      user_id: tokenPayload.id
    })
  });

  it('does not accept if not logged in', async () => {
    const variables =  {
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


  it('found empty medications of child', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    const variables =  {
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
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    // create child-medication
    const medication = await Medication.create({
      name: '_medication_name_'
    })
    const childMedication = await ChildMedication.create({
      child_id: childrenCreated.id,
      medication_id: medication.id,
      days
    })

    const variables =  {
      id: childrenCreated.id
    }
    const res = await query({
      query: CHILD_MEDICATIONS_QUERY,
      variables
    })
    await Promise.all([
      Medication.deleteOne({
        _id: medication.id
      }),
      ChildMedication.deleteOne({
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

  it('found multiple child medication just added to children', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
    // create child-medication
    const medication = await Medication.create({
      name: '_medication_name_',
      user_id: tokenPayload.id,
    })
    const childMedication = await ChildMedication.create({
      child_id: childrenCreated.id,
      medication_id: medication.id,
      days
    })
    const medication2 = await Medication.create({
      name: '_medication_name_2_',
      user_id: tokenPayload.id,
    })
    const childMedication2 = await ChildMedication.create({
      child_id: childrenCreated.id,
      medication_id: medication.id,
      days
    })

    const variables =  {
      id: childrenCreated.id
    }
    const res = await query({
      query: CHILD_MEDICATIONS_QUERY,
      variables
    })
    await Promise.all([
      Medication.deleteMany({
        _id: [medication.id, medication2.id]
      }),
      ChildMedication.deleteMany({
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

  afterAll(async function(){
    await Children.deleteOne({
      _id: childrenCreated.id
    })
  })
})