import {gql} from 'apollo-server';

import server from '../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../createTestServer'
import { ChildMedication, Children, Diagnoses, Medication } from '../../../../src/db/models';
import { connectDB } from '../../../../src/db';
import { encrypt } from '../../../../src/tools/encryption';
import { authorizedHeaders, getToken, tokenPayload, tokenPayloadUser2 } from '../../../helper'
import { Types } from 'mongoose';
import { ChildMedicationInput, DayOfWeek } from '../../../../src/types/schema.types';
import dayjs from 'dayjs';

const apolloServerClient = createTestClient(server);

const ADD_CHILD_MEDICATION = gql`
  mutation AddChildMedication($childId: ID!, $medication: ChildMedicationInput!) {
    child {
      medication {
        add (childId: $childId, medication: $medication) {
          id
          medication {
            id
            days
          }
        }
      }
    }
  }
`;

describe('childMedication.add mutation', () => {

  let childId: string
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
  beforeAll(async function() {
    await connectDB()
    const nameEncrypted = await encrypt('_child_name_')
    const child = await Children.create({
      name: nameEncrypted,
      age: 1,
      user_id: tokenPayload.id
    })
    childId = child.id
  });

  it('does not accept if not logged in', async () => {
    const medicationInput: ChildMedicationInput = {
      medication: {
        name: 'medication #1'
      }
    }
    const res = await apolloServerClient.mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
        code: 'UNAUTHENTICATED'
    }));
  });

  it('should throw error if childId is empty', async () => {
    const medicationInput: ChildMedicationInput = {
      medication: {
        name: 'medication #1'
      }
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId: '   ',
          medication: medicationInput
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Cannot input empty child');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if childId is not found', async () => {
    const medicationInput: ChildMedicationInput = {
      medication: {
        name: 'medication #1'
      }
    }
    const child2 = await Children.create({
      name: await encrypt('_child_name_2_'),
      age: 1,
      user_id: tokenPayloadUser2.id
    })
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId: child2.id,
          medication: medicationInput
        }
    });
    await Children.deleteOne({
      _id: child2.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child cannot found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if medication Id provided not exist', async () => {
    const medication = await Medication.create({
      name: '_medication_name_',
      user_id: tokenPayloadUser2.id
    })
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      }
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput
        }
    });
    await Medication.deleteOne({
      _id: medication.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Cannot found medication');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if not valid neither medication name nor medication Id', async () => {
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: '',
        name: ''
      }
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput
        }
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Please provide at least a known medication or new medication name');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should create child medication reference to exist medication successfully', async () => {
    const medication = await Medication.create({
      name: '_medication_name_',
      user_id: tokenPayload.id
    })
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput
        }
    });
    await Medication.deleteOne({
      _id: medication.id
    })

    const childMedication = await ChildMedication.findOne({
      child_id: childId,
    })
    await ChildMedication.deleteOne({
      _id: childMedication.id
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            add: {
              id: childMedication.id,
              medication: {
                id: childMedication.id,
                days
              }
            },
          },
        },
      }),
    )
  });

  it('should throw error if takenFrom or takenTo is not valid', async () => {
    const medication = await Medication.create({
      name: '_medication_name_',
      user_id: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: 'abc',
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput
        }
    });
    await Medication.deleteOne({
      _id: medication.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenFrom > takenTo', async () => {
    const medication = await Medication.create({
      name: '_medication_name_',
      user_id: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: dayjs().toISOString(),
      takenTo: dayjs().subtract(1, 'm').toISOString()
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput
        }
    });
    await Medication.deleteOne({
      _id: medication.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should create child medication days not enums are unique', async () => {
    const medication = await Medication.create({
      name: '_medication_name_',
      user_id: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput
        }
    });
    await Medication.deleteOne({
      _id: medication.id
    })

    const childMedication = await ChildMedication.findOne({
      child_id: childId,
    })
    await ChildMedication.deleteOne({
      _id: childMedication.id
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            add: {
              id: childMedication.id,
              medication: {
                id: childMedication.id,
                days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
              }
            },
          },
        },
      }),
    )
  });

  it('should create child medication reference to new medication successfully', async () => {
    const medicationInput: ChildMedicationInput = {
      medication: {
        name: '_new_medication_name_'
      },
      days
    }
    const { mutate } = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
        mutation: ADD_CHILD_MEDICATION,
        variables: {
          childId,
          medication: medicationInput,
          takenFrom: dayjs().subtract(1, 'm').toISOString(),
          takenTo: dayjs().toISOString(),
        }
    });

    const childMedication = await ChildMedication.findOne({
      child_id: childId,
    })
    await Promise.all([
      ChildMedication.deleteOne({
        _id: childMedication.id,
      }),
      Medication.deleteOne({
        _id: childMedication.medication_id,
      }),
    ])

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            add: {
              id: childMedication.id,
              medication: {
                id: childMedication.id,
                days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
              }
            },
          },
        },
      }),
    )
  });


  afterAll(async function(){
    
    await Promise.all([
      Children.deleteOne({
        _id: childId,
      }),
    ])
  })

});