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

const REMOVE_CHILD_DIAGNOSIS = gql`
    mutation RemoveKnownDiagnosis($childId: ID!, $diagnosisId: ID!) {
        child {
            diagnosis {
                remove (childId: $childId, diagnosisId: $diagnosisId) {
                    id
                    removed
                }
            }
        }
    }
`;

describe('childDiagnosis.remove mutations', () => {

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
      mutation: REMOVE_CHILD_DIAGNOSIS,
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
      mutation: REMOVE_CHILD_DIAGNOSIS,
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
      mutation: REMOVE_CHILD_DIAGNOSIS,
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
      mutation: REMOVE_CHILD_DIAGNOSIS,
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

  it('should not remove when child doesn\'t have diagnosis', async () => {
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $push: {
        'diagnoses': diagnosisId
      }
    })
    // create another diagnosesResolver and not add to child
    const diagnosis2 = await DiagnosisModel.create({
      name: 'Diagnosis 2',
      user: tokenPayload.id
    })

    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: REMOVE_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId: diagnosis2.id
      },
    });
    // delete diagnosis 2
    await DiagnosisModel.deleteOne({
      _id: diagnosis2.id
    })

    // should check from db side
    const childrenUpdated = await ChildModel.findOne({
      _id: childId
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Diagnosis is not exist in child');
    // because it was not removed from child so should cover it here
    expect(childrenUpdated.diagnoses).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosisId)])
    )
    // after retrieve from db, should from diagnosis from child
    // in order to make Children clean 
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        'diagnoses': []
      }
    })
  });

  it('remove diagnosis from child successfully', async () => {
    await ChildModel.findOneAndUpdate({
      _id: childId
    }, {
      $push: {
        'diagnoses': diagnosisId
      }
    })

    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: REMOVE_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    const childrenUpdated = await ChildModel.findOne({
      _id: childId
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          diagnosis: {
            remove: {
              id: diagnosisId,
              removed: true
            },
          },
        },
      }),
    )
    expect(childrenUpdated.diagnoses).toEqual(
      jasmine.objectContaining([])
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
