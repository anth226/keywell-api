import {gql} from 'apollo-server';

import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer'
import {ChildMedicationModel, ChildModel, MedicationModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {encrypt} from '../../../../../src/tools/encryption';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper'
import {ChildMedicationInput, DayOfWeek} from '../../../../../src/types/schema.types';
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
                        sendReminder
                        scheduleTime {
                            from
                            to
                        }
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
`;

describe('medication.add mutations', () => {

  let childId: string
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
  beforeAll(async function () {
    await connectDB()
    const nameEncrypted = await encrypt('_child_name_')
    const child = await ChildModel.create({
      name: nameEncrypted,
      age: 1,
      user: tokenPayload.id
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    const child2 = await ChildModel.create({
      name: await encrypt('_child_name_2_'),
      age: 1,
      user: tokenPayloadUser2.id
    })
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId: child2.id,
        medication: medicationInput
      }
    });
    await ChildModel.deleteOne({
      _id: child2.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toEqual('Child cannot found');
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if medication Id provided not exist', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayloadUser2.id
    })
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      }
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
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
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
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
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const medicationId = medication.id;
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });

    const childMedication = await ChildMedicationModel.findOne({
      child: childId,
    })
    await ChildMedicationModel.deleteOne({
      _id: childMedication.id
    })
    await MedicationModel.deleteOne({
      _id: medication.id
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
                days,
                sendReminder: false,
                scheduleTime: null,
                medication: {
                  id: medicationId,
                  name: '_medication_name_',
                  availableDoses: []
                }
              }
            },
          },
        },
      }),
    )
  });

  it('should throw error if takenFrom or takenTo is not valid', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: 'abc',
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenFrom > takenTo', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: dayjs().format('HH:mm'),
      takenTo: dayjs().subtract(1, 'm').format('HH:mm')
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenFrom is not valid', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: dayjs().format('HH:mm'),
      takenTo: dayjs().subtract(1, 'm').format('HH:mm')
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenFrom is not valid', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: dayjs().toISOString(),
      takenTo: 'string is not a valid time',
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    // expect 2 errors -> scalar errors & bad input
    expect(res.errors?.length).toBe(2);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenTo is not valid', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: 'string is not a valid time',
      takenTo: dayjs().subtract(1, 'm').toISOString()
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    // expect 2 errors -> scalar errors & bad input
    expect(res.errors?.length).toBe(2);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenFrom is not valid', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: dayjs().toISOString(),
      takenTo: 'string is not a valid time',
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    // expect 2 errors -> scalar errors & bad input
    expect(res.errors?.length).toBe(2);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenTo is not valid', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: 'string is not a valid time',
      takenTo: dayjs().subtract(1, 'm').toISOString()
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    // expect 2 errors -> scalar errors & bad input
    expect(res.errors?.length).toBe(2);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should throw error if takenTo is not valid', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom: 'string is not a valid time',
      takenTo: dayjs().subtract(1, 'm').toISOString()
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    // expect 2 errors -> scalar errors & bad input
    expect(res.errors?.length).toBe(2);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('should create child medication days not enums are unique', async () => {
    const medication = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayload.id
    })
    const takenFrom = '14:12'
    const takenTo = '14:12'
    const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Monday]
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days,
      takenFrom,
      takenTo,
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    const childMedication = await ChildMedicationModel.findOne({
      child: childId,
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
                days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
                sendReminder: false,
                scheduleTime: {
                  from: takenFrom,
                  to: takenTo,
                },
                medication: {
                  id: childMedication.medication.toString(),
                  name: '_medication_name_',
                  availableDoses: []
                }
              }
            },
          },
        },
      }),
    )

    await ChildMedicationModel.deleteOne({
      _id: childMedication.id
    })
  });

  it('should create child medication reference to new medication successfully', async () => {
    const medicationInput: ChildMedicationInput = {
      medication: {
        name: '_new_medication_name_'
      },
      days
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput,
        takenFrom: dayjs().subtract(1, 'm').toISOString(),
        takenTo: dayjs().toISOString(),
      }
    });

    const childMedication = await ChildMedicationModel.findOne({
      child: childId,
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
                days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
                sendReminder: false,
                scheduleTime: null,
                medication: {
                  id: childMedication.medication.toString(),
                  name: '_new_medication_name_',
                  availableDoses: []
                }
              }
            },
          },
        },
      }),
    )

    await Promise.all([
      ChildMedicationModel.deleteOne({
        _id: childMedication.id,
      }),
      MedicationModel.deleteOne({
        _id: childMedication.medication,
      }),
    ])
  });

  it('should create child medication reference to exist medication full information successfully', async () => {
    const medicationPayload = {
      name: '_medication_name_',
      user: tokenPayload.id
    }
    const medication = await MedicationModel.create(medicationPayload)
    const takenTime = {
      takenFrom: '00:00',
      takenTo: '23:00',
    }
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
      ...takenTime,
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    const childMedication = await ChildMedicationModel.findOne({
      child: childId,
    })
    await ChildMedicationModel.deleteOne({
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
                days,
                sendReminder: false,
                scheduleTime: {
                  from: takenTime.takenFrom,
                  to: takenTime.takenTo,
                },
                medication: {
                  id: medication.id,
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

  it('should create child medication reference to exist medication by name full information successfully', async () => {
    const medicationName = '_medication_name_'
    const medicationPayload = {
      name: medicationName,
      user: tokenPayload.id
    }
    const medication = await MedicationModel.create(medicationPayload)
    const takenTime = {
      takenFrom: '00:00',
      takenTo: '23:00',
    }
    const medicationInput: ChildMedicationInput = {
      medication: {
        name: medicationName.toUpperCase()
      },
      days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
      ...takenTime,
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput
      }
    });
    await MedicationModel.deleteOne({
      _id: medication.id
    })

    const childMedication = await ChildMedicationModel.findOne({
      child: childId,
    })
    await ChildMedicationModel.deleteOne({
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
                days,
                sendReminder: false,
                scheduleTime: {
                  from: takenTime.takenFrom,
                  to: takenTime.takenTo,
                },
                medication: {
                  id: medication.id,
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

  it('should throw CONFLICT error if child medication exist already ', async () => {
    const medicationPayload = {
      name: '_medication_name_',
      user: tokenPayload.id,
    }
    const medication = await MedicationModel.create(medicationPayload)
    const medicationInput: ChildMedicationInput = {
      medication: {
        id: medication.id,
      },
      days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
    }
    const childMedicationCreated = await ChildMedicationModel.create({
      medication: medication.id,
      child: childId,
      days,
    })
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: ADD_CHILD_MEDICATION,
      variables: {
        childId,
        medication: medicationInput,
      },
    })
    await MedicationModel.deleteOne({
      _id: medication.id,
    })

    await ChildMedicationModel.deleteOne({
      _id: childMedicationCreated.id,
    })

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'CONFLICT',
      }),
    )
  })

  afterAll(async function () {

    await Promise.all([
      ChildModel.deleteOne({
        _id: childId,
      }),
    ])
  })

});
