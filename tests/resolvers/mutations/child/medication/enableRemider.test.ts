import {gql} from 'apollo-server';

import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {ChildMedicationModel, ChildModel, MedicationModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {encrypt} from '../../../../../src/tools/encryption';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper'

const apolloServerClient = createTestClient(server);

const ENABLE_REMINDER = gql`
  mutation EnableReminder($childMedicationId: ID!, $enable: Boolean!) {
    child {
      medication {
        enableReminder (childMedicationId: $childMedicationId, enabled: $enable) {
          id
          medication {
            id
            sendReminder
          }
        }
      }
    }
  }
`;

describe('childMedication.enableReminder mutation', () => {

  let childId: string
  let medicationId: string
  let childMedicationId: string
  const medicationPayload = {
    name: '_medication_name_',
    user: tokenPayload.id
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
    const medication = await MedicationModel.create(medicationPayload)
    medicationId = medication.id

    const childMedication = await ChildMedicationModel.create({
      child: childId,
      medication: medicationId,
    })
    childMedicationId = childMedication.id
  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.mutate({
        mutation: ENABLE_REMINDER,
        variables: {
          childMedicationId,
          enable: true
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
        code: 'UNAUTHENTICATED'
    }));
  });

  it('should throw error if childMedicationId is empty', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ENABLE_REMINDER,
        variables: {
          childMedicationId: '   ',
          enable: true
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child medication Id cannot be empty');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if childMedicationId is not found', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    // pre-generated id
    const id = '60cc66eb7b461caf0294b8d9'
    const res = await mutate({
        mutation: ENABLE_REMINDER,
        variables: {
          childMedicationId: id,
          enable: true
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child medication Id cannot be found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if child is not found', async () => {
    const nameEncrypted2 = await encrypt('_child_name_user2_')
    const child = await ChildModel.create({
      name: nameEncrypted2,
      age: 1,
      user: tokenPayloadUser2.id
    })
    const childMedication2 = await ChildMedicationModel.create({
      child: child.id,
      medication: medicationId,
    })
    
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ENABLE_REMINDER,
        variables: {
          childMedicationId: childMedication2.id,
          enable: true
        }
    });
    await Promise.all([
      ChildMedicationModel.deleteOne({_id: childMedication2.id}),
      ChildModel.deleteOne({_id: child.id})
    ])

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child cannot be found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should enable childMedicationId reminder successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ENABLE_REMINDER,
        variables: {
          childMedicationId,
          enable: true
        }
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            enableReminder: {
              id: childMedicationId,
              medication: {
                id: childMedicationId,
                sendReminder: true
              }
            },
          },
        },
      }),
    )
  });

  it('should disable childMedicationId reminder successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ENABLE_REMINDER,
        variables: {
          childMedicationId,
          enable: false
        }
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            enableReminder: {
              id: childMedicationId,
              medication: {
                id: childMedicationId,
                sendReminder: false
              }
            },
          },
        },
      }),
    )
  });

  it('should disable childMedicationId reminder successfully & medication resolver successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: gql`
          mutation EnableReminder($childMedicationId: ID!, $enable: Boolean!) {
            child {
              medication {
                enableReminder (childMedicationId: $childMedicationId, enabled: $enable) {
                  id
                  medication {
                    id
                    sendReminder
                    medication {
                      id
                      name
                      availableDoses
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          childMedicationId,
          enable: false
        }
    });

    expect(res.errors?.length).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            enableReminder: {
              id: childMedicationId,
              medication: {
                id: childMedicationId,
                sendReminder: false,
                medication: {
                  id: medicationId,
                  name: medicationPayload.name,
                  availableDoses: []
                }
              }
            },
          },
        },
      }),
    )
  });

  afterAll(async function(){
    
    await Promise.all([
      ChildModel.deleteOne({
        _id: childId
      }),
      MedicationModel.deleteOne({
        _id: medicationId
      }),
      ChildMedicationModel.deleteOne({
        _id: childMedicationId
      })
    ])
  })
})