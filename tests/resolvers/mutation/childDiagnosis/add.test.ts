import {gql} from 'apollo-server';

import server from '../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../createTestServer'
import { Children, Diagnoses } from '../../../../src/db/models';
import { connectDB } from '../../../../src/db';
import { encrypt } from '../../../../src/tools/encryption';
import { authorizedHeaders, getToken, tokenPayload, tokenPayloadUser2 } from '../../../helper'
import { Types } from 'mongoose';

const apolloServerClient = createTestClient(server);

const ADD_CHILD_DIAGNOSIS = gql`
    mutation AddKnownDiagnosis($childId: ID!, $diagnosisId: ID!) {
      child {
        diagnosis {
          add (childId: $childId, diagnosisId: $diagnosisId) {
            id
            added
          }
        }
      }
    }
`;

describe('childDiagnosis.add mutation', () => {

  let diagnosisId: string
  let childId: string
  beforeAll(async function() {
    await connectDB()
    const nameEncrypted = await encrypt('_child_name_')
    const [child, diagnosis] = await Promise.all([
      Children.create({
        name: nameEncrypted,
        age: 1,
        user_id: tokenPayload.id
      }),
      Diagnoses.create({
        name: 'Diagnosis 1',
        user_id: tokenPayload.id
      })
    ])
    diagnosisId = diagnosis.id
    childId = child.id
  });

  it('does not accept if not logged in', async () => {
      const res = await apolloServerClient.mutate({
          mutation: ADD_CHILD_DIAGNOSIS,
          variables: {
            childId,
            diagnosisId
          }
      });

      expect(res.errors?.length).toBe(1);
      expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
          code: 'UNAUTHENTICATED'
      }));
  });

  it('does not accept empty childId field', async () => {
      const { mutate } = initServerWithHeaders(server, authorizedHeaders)
      const res = await mutate({
          mutation: ADD_CHILD_DIAGNOSIS,
          variables: {
            childId: '  ',
            diagnosisId
          },
      });

      expect(res.errors?.length).toBe(1);
      expect(res.errors?.[0].message).toEqual('Child must not be empty');
      expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
          code: 'BAD_USER_INPUT'
      }));
  });

  it('does not accept empty diagnosisId field', async () => {
      const { mutate } = initServerWithHeaders(server, authorizedHeaders)
      const res = await mutate({
          mutation: ADD_CHILD_DIAGNOSIS,
          variables: {
            childId,
            diagnosisId: '    '
          },
      });

      expect(res.errors?.length).toBe(1);
      expect(res.errors?.[0].message).toEqual('Diagnosis must not be empty');
      expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
          code: 'BAD_USER_INPUT'
      }));
  });

  it('does not found other user\'s child', async () => {
    const token = await getToken(tokenPayloadUser2)
    const authorizationHeaderUser2 = {
      authorization: `Bearer ${token}`
    }

    const { mutate } = initServerWithHeaders(server, authorizationHeaderUser2)
    const res = await mutate({
        mutation: ADD_CHILD_DIAGNOSIS,
        variables: {
          childId,
          diagnosisId
        },
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child is not exist');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
        code: 'BAD_USER_INPUT'
    }));
  });

  it('should return error if child already have diagnosis', async () => {
    // assign diagnosis to child
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $push: {
        'diagnoses_id': diagnosisId
      }
    })

    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    // reset child
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        'diagnoses_id': []
      }
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
        code: 'CONFLICT'
    }));
});

  it('add diagnosis to child successfully', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    // should check from db side
    const childrenUpdated = await Children.findOne({
      _id: childId
    })
    // reset children diagnoses
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        diagnoses_id: []
      }
    })


    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          diagnosis: {
            add: {
              id: diagnosisId,
              added: true
            },
          },
        },
      }),
    )
    expect(childrenUpdated.diagnoses_id).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosisId)])
    )
  });

  it('add 2 diagnosis to child successfully', async () => {
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    const diagnosis2 = await Diagnoses.create({
      name: 'Diagnosis 1',
      user_id: tokenPayload.id
    })

    const res2 = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId: diagnosis2.id
      },
    });

    // should check from db side
    const childrenUpdated = await Children.findOne({
      _id: childId
    })
    // reset children diagnoses
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        diagnoses_id: []
      }
    })

    // delete diagnosis2
    await Diagnoses.deleteOne({
      _id: diagnosis2.id
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          diagnosis: {
            add: {
              id: diagnosisId,
              added: true
            },
          },
        },
      }),
    )
    expect(res2.errors).toBe(undefined);
    expect(res2.data).toEqual(
      jasmine.objectContaining({
        child: {
          diagnosis: {
            add: {
              id: diagnosis2.id,
              added: true
            },
          },
        },
      }),
    )
    expect(childrenUpdated.diagnoses_id).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosisId), Types.ObjectId(diagnosis2.id)])
    )
  });

  it('add 2 common diagnosis to child successfully', async () => {
    const diagnosis1 = await Diagnoses.create({
      name: 'ADHD',
    })
    
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId: diagnosis1.id
      },
    });

    const diagnosis2 = await Diagnoses.create({
      name: 'Diagnosis 1',
    })

    const res2 = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId: diagnosis2.id
      },
    });

    // should check from db side
    const childrenUpdated = await Children.findOne({
      _id: childId
    })
    // reset children diagnoses
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        diagnoses_id: []
      }
    })

    // delete diagnosis2
    await Diagnoses.deleteMany({
      _id: [diagnosis1.id, diagnosis2.id]
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          diagnosis: {
            add: {
              id: diagnosis1.id,
              added: true
            },
          },
        },
      }),
    )
    expect(res2.errors).toBe(undefined);
    expect(res2.data).toEqual(
      jasmine.objectContaining({
        child: {
          diagnosis: {
            add: {
              id: diagnosis2.id,
              added: true
            },
          },
        },
      }),
    )
    expect(childrenUpdated.diagnoses_id).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosis1.id), Types.ObjectId(diagnosis2.id)])
    )
  });

  afterAll(async function(){
    
    await Promise.all([
      Children.deleteOne({
        _id: childId,
      }),
      Diagnoses.deleteOne({
        _id: diagnosisId
      })
    ])
  })

});