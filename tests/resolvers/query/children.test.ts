import {gql} from 'apollo-server';
import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import { initServerWithHeaders } from '../../createTestServer'
import { Children, Diagnoses, IChildren, IDiagnosis } from '../../../src/db/models';
import { connectDB } from '../../../src/db';
import { authorizedHeaders, getToken, tokenPayload, tokenPayloadUser2 } from '../../helper';
import { encrypt } from '../../../src/tools/encryption';

const apolloServerClient = createTestClient(server);

const CHILDREN_QUERY = gql`
    query Children($sortBy: ChildrenSortInput) {
      children(sortBy: $sortBy) {
        id
      }
    }
`;

describe('children query', () => {
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
    const { query } = initServerWithHeaders(server, authorizationHeaderUser2)
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
      const { query } = initServerWithHeaders(server, authorizedHeaders)
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
      const { query } = initServerWithHeaders(server, authorizedHeaders)
      // add second child
      const nameEncrypted = await encrypt(childrenData.name);
      const childCreated2 = await Children.create({
        name: nameEncrypted,
        age: childrenData.age,
        user_id: tokenPayload.id
      })
      const childCreated2Id = childCreated2.id
      
      const res = await query({
        query: CHILDREN_QUERY,
      });

      // delete second child just created
      await Children.deleteOne({
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
      const { query } = initServerWithHeaders(server, authorizedHeaders)
      // add second child
      const nameEncrypted = await encrypt(childrenData.name);
      const childCreated2 = await Children.create({
        name: nameEncrypted,
        age: childrenData.age,
        user_id: tokenPayload.id
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
      await Children.deleteOne({
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
      const { query } = initServerWithHeaders(server, authorizedHeaders)
      // add second child
      const nameEncrypted = await encrypt(childrenData.name);
      const childCreated2 = await Children.create({
        name: nameEncrypted,
        age: childrenData.age,
        user_id: tokenPayload.id
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
      await Children.deleteOne({
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
    const { query } = initServerWithHeaders(server, authorizedHeaders)
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


  afterAll(async function(){
    await Children.deleteOne({
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

describe('children.diagnoses query', () => {
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
        query: CHILDREN_DIAGNOSES_QUERY,
      });

      expect(res.errors?.length).toBe(1);
      expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
          code: 'UNAUTHENTICATED'
      }));
  });


  it('found empty diagnoses of children', async () => {
    const { query } = initServerWithHeaders(server, authorizedHeaders)
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
      query: CHILDREN_DIAGNOSES_QUERY,
    })

    await Diagnoses.deleteOne({
      _id: diagnosisCreated.id
    })

    // remove assigned diagnoses_id
    await Children.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses_id': []
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
      query: CHILDREN_DIAGNOSES_QUERY,
    })


    // delete diagnoses 2
    await Diagnoses.deleteMany({
      _id: [diagnosisCreated.id, diagnosisCreated2.id]
    })
    // remove assigned diagnoses_id
    await Children.findOneAndUpdate({
      _id: childrenCreated.id
    }, {
      $set: {
        'diagnoses_id': []
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
              },
              {
                ...diagnosisData2,
                id: diagnosisCreated2.id,
              },
            ]
          }
        ]
      }),
    )
  });

  afterAll(async function(){
    await Children.deleteOne({
      _id: childrenCreated.id
    })
  })
});