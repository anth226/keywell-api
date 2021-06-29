import {gql} from 'apollo-server';

import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {ChildModel, DiagnosisModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {encrypt} from '../../../../../src/tools/encryption';
import {authorizedHeaders, getToken, tokenPayload, tokenPayloadUser2} from '../../../../helper'
import {Types} from 'mongoose';

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

describe('childDiagnosis.add mutations', () => {

  let diagnosisId: string
  let childId: string
  beforeAll(async function () {
    await connectDB()
    const nameEncrypted = await encrypt('_child_name_')
    const [child, diagnosis] = await Promise.all([
      ChildModel.create({
        name: nameEncrypted,
        age: 1,
        user: tokenPayload.id
      }),
      DiagnosisModel.create({
        name: 'Diagnosis 1',
        user: tokenPayload.id
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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

    const {mutate} = initServerWithHeaders(server, authorizationHeaderUser2)
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
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $push: {
        'diagnoses': diagnosisId
      }
    })

    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    // reset child
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        'diagnoses': []
      }
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'CONFLICT'
    }));
  });

  it('add diagnosis to child successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    // should check from db side
    const childrenUpdated = await ChildModel.findOne({
      _id: childId
    })
    // reset children diagnosesResolver
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        diagnoses: []
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
    expect(childrenUpdated.diagnoses).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosisId)])
    )
  });

  it('add 2 diagnosis to child successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    const diagnosis2 = await DiagnosisModel.create({
      name: 'Diagnosis 1',
      user: tokenPayload.id
    })

    const res2 = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId: diagnosis2.id
      },
    });

    // should check from db side
    const childrenUpdated = await ChildModel.findOne({
      _id: childId
    })
    // reset children diagnosesResolver
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        diagnoses: []
      }
    })

    // delete diagnosis2
    await DiagnosisModel.deleteOne({
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
    expect(childrenUpdated.diagnoses).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosisId), Types.ObjectId(diagnosis2.id)])
    )
  });

  it('add 2 common diagnosis to child successfully', async () => {
    const diagnosis1 = await DiagnosisModel.create({
      name: 'ADHD',
    })

    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId: diagnosis1.id
      },
    });

    const diagnosis2 = await DiagnosisModel.create({
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
    const childrenUpdated = await ChildModel.findOne({
      _id: childId
    })
    // reset children diagnosesResolver
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        diagnoses: []
      }
    })

    // delete diagnosis2
    await DiagnosisModel.deleteMany({
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
    expect(childrenUpdated.diagnoses).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosis1.id), Types.ObjectId(diagnosis2.id)])
    )
  });

  afterAll(async function () {

    await Promise.all([
      ChildModel.deleteOne({
        _id: childId,
      }),
      DiagnosisModel.deleteOne({
        _id: diagnosisId
      })
    ])
  })

});
