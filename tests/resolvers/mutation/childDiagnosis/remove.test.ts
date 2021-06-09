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

describe('childDiagnosis.remove mutation', () => {

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
      const { mutate } = initServerWithHeaders(server, authorizedHeaders)
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
      const { mutate } = initServerWithHeaders(server, authorizedHeaders)
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

    const { mutate } = initServerWithHeaders(server, authorizationHeaderUser2)
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
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $push: {
        'diagnoses_id': diagnosisId
      }
    })
    // create another diagnoses and not add to child
    const diagnosis2 = await Diagnoses.create({
      name: 'Diagnosis 2',
      user_id: tokenPayload.id
    })
    
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: REMOVE_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId: diagnosis2.id
      },
    });
    // delete diagnosis 2
    await Diagnoses.deleteOne({
      _id: diagnosis2.id
    })

    // should check from db site
    const childrenUpdated = await Children.findOne({
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
    // because it was not removed from child so should cover it here
    expect(childrenUpdated.diagnoses_id).toEqual(
      jasmine.objectContaining([Types.ObjectId(diagnosisId)])
    )
    // after retrieve from db, should from diagnosis_id from child 
    // in order to make Children clean 
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $set: {
        'diagnoses_id': []
      }
    })
  });

  it('remove diagnosis from child successfully', async () => {
    await Children.findOneAndUpdate({
      _id: childId
    }, {
      $push: {
        'diagnoses_id': diagnosisId
      }
    })
    
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: REMOVE_CHILD_DIAGNOSIS,
      variables: {
        childId,
        diagnosisId
      },
    });

    const childrenUpdated = await Children.findOne({
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
    expect(childrenUpdated.diagnoses_id).toEqual(
      jasmine.objectContaining([])
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