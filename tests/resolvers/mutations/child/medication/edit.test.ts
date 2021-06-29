import {gql} from 'apollo-server'

import server from '../../../../../src/server'
import {createTestClient} from 'apollo-server-testing'
import {initServerWithHeaders} from '../../../../createTestServer'
import {
  ChildMedicationModel,
  ChildModel,
  MedicationModel,
} from '../../../../../src/db/models'
import {connectDB} from '../../../../../src/db'
import {encrypt} from '../../../../../src/tools/encryption'
import {
  authorizedHeaders,
  tokenPayload,
  tokenPayloadUser2,
} from '../../../../helper'
import {
  ChildMedicationMutationsEditArgs,
  ChildMedicationUpdateInput,
  DayOfWeek,
} from '../../../../../src/types/schema.types'

const apolloServerClient = createTestClient(server)

const EDIT_CHILD_MEDICATION = gql`
  mutation AddChildMedication(
    $childMedicationId: ID!
    $medication: ChildMedicationUpdateInput!
  ) {
    child {
      medication {
        edit(childMedicationId: $childMedicationId, medication: $medication) {
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
`

describe('medication.edit mutations', () => {
  let childId: string
  let medicationId: string
  let childMedicationId: string
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
  const medicationName = '_medication_name_'
  const takenFrom = '10:00'
  const takenTo = '12:00'
  
  beforeAll(async function () {
    await connectDB()
    const nameEncrypted = await encrypt('_child_name_')
    const child = await ChildModel.create({
      name: nameEncrypted,
      age: 1,
      user: tokenPayload.id,
    })
    childId = child.id
    const medication = await MedicationModel.create({
      name: medicationName,
      user: tokenPayload.id,
    })
    medicationId = medication.id

    const childMedication = await ChildMedicationModel.create({
      child: child.id,
      medication: medication.id,
      days,
      scheduleTime: {
        from: takenFrom,
        to: takenTo
      }
    })
    childMedicationId = childMedication.id
    
  })

  it('does not accept if not logged in', async () => {
    const medication: ChildMedicationUpdateInput = {
      sendReminder: true
    }
    const variables: ChildMedicationMutationsEditArgs = {
      childMedicationId,
      medication
    }
    const res = await apolloServerClient.mutate({
      mutation: EDIT_CHILD_MEDICATION,
      variables,
    })

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      }),
    )
  })

  it('should throw error if childId is empty', async () => {
    const medication: ChildMedicationUpdateInput = {
      sendReminder: true
    }
    const variables: ChildMedicationMutationsEditArgs = {
      childMedicationId: '      ',
      medication
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: EDIT_CHILD_MEDICATION,
      variables,
    })

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].message).toEqual('Cannot input empty childMedicationId')
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      }),
    )
  })

  it('should throw error if childId is not found', async () => {
    const child2 = await ChildModel.create({
      name: await encrypt('_child_name_2_'),
      age: 1,
      user: tokenPayloadUser2.id,
    })
    const medication2 = await MedicationModel.create({
      name: '_medication_name_',
      user: tokenPayloadUser2.id,
    })

    const childMedication2 = await ChildMedicationModel.create({
      child: child2.id,
      medication: medication2.id,
      days,
      scheduleTime: {
        from: takenFrom,
        to: takenTo
      }
    })
    const medication: ChildMedicationUpdateInput = {
      sendReminder: true
    }
    const variables: ChildMedicationMutationsEditArgs = {
      childMedicationId: childMedication2.id,
      medication
    }
    
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: EDIT_CHILD_MEDICATION,
      variables,
    })
    await Promise.all([
      ChildModel.deleteOne({_id: child2.id}),
      MedicationModel.deleteOne({_id: medication2.id}),
      ChildMedicationModel.deleteOne({_id: childMedication2.id})
    ])

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].message).toEqual('Child cannot be found')
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      }),
    )
  })

  it('should throw error if childMedicationId provided not exist', async () => {
    const medication: ChildMedicationUpdateInput = {
      sendReminder: true
    }
    const variables: ChildMedicationMutationsEditArgs = {
      childMedicationId: '60d3279b303aaefb9ac7e129', // pre-filled
      medication
    }
    
    // 
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: EDIT_CHILD_MEDICATION,
      variables,
    })

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].message).toEqual('Child medication Id cannot be found')
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      }),
    )
  })

  it('should update Child medication successfully reference to exist Medication', async () => {
    const medicationName = '_medication_name_2_'
    const medication2 = await MedicationModel.create({
      name: medicationName,
      user: tokenPayload.id
    })

    const medication: ChildMedicationUpdateInput = {
      sendReminder: true,
      medication: {
        id: medication2.id
      }
    }
    const variables: ChildMedicationMutationsEditArgs = {
      childMedicationId,
      medication
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: EDIT_CHILD_MEDICATION,
      variables,
    })
    // delete created Medication
    await MedicationModel.deleteOne({_id: medication2.id})

    // reset Child Medication
    await ChildMedicationModel.findOneAndUpdate({
      _id: childMedicationId,
    }, {
      $set: {
        sendReminder: false,
        medication: medicationId
      }
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            edit: {
              id: childMedicationId,
              medication: {
                id: childMedicationId,
                days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
                sendReminder: true,
                scheduleTime: {
                  from: takenFrom,
                  to: takenTo,
                },
                medication: {
                  id: medication2.id,
                  name: medicationName,
                  availableDoses: []
                }
              }
            },
          },
        },
      }),
    )
  })

  it('should update Child medication successfully', async () => {
    const _takenFrom = '06:00'
    const _takenTo = '08:00'
    const medication: ChildMedicationUpdateInput = {
      sendReminder: true,
      takenFrom: _takenFrom,
      takenTo: _takenTo,
      dose: '2mg',
      doseAmount: 2
    }
    const variables: ChildMedicationMutationsEditArgs = {
      childMedicationId,
      medication
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: gql`
        mutation AddChildMedication(
          $childMedicationId: ID!
          $medication: ChildMedicationUpdateInput!
        ) {
          child {
            medication {
              edit(childMedicationId: $childMedicationId, medication: $medication) {
                id
                medication {
                  id
                  days
                  sendReminder
                  dose
                  doseAmount
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
      `,
      variables,
    })

    // reset Child Medication
    await ChildMedicationModel.findOneAndUpdate({
      _id: childMedicationId,
    }, {
      $set: {
        sendReminder: false,
        scheduleTime: {
          from: takenFrom,
          to: takenTo,
        },
        dose: '',
        doseAmount: 0,
        medication: medicationId
      }
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            edit: {
              id: childMedicationId,
              medication: {
                id: childMedicationId,
                days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
                sendReminder: true,
                scheduleTime: {
                  from: _takenFrom,
                  to: _takenTo,
                },
                dose: '2mg',
                doseAmount: 2,
                medication: {
                  id: medicationId,
                  name: medicationName,
                  availableDoses: []
                }
              }
            },
          },
        },
      }),
    )
  })

  it('should update Child medication reference to exist Medication by name', async () => {
    const _takenFrom = '06:00'
    const _takenTo = '08:00'
    const medication: ChildMedicationUpdateInput = {
      sendReminder: true,
      takenFrom: _takenFrom,
      takenTo: _takenTo,
      dose: '2mg',
      doseAmount: 2,
      medication: {
        name: medicationName.toUpperCase()
      }
    }
    const variables: ChildMedicationMutationsEditArgs = {
      childMedicationId,
      medication
    }
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const res = await mutate({
      mutation: gql`
        mutation AddChildMedication(
          $childMedicationId: ID!
          $medication: ChildMedicationUpdateInput!
        ) {
          child {
            medication {
              edit(childMedicationId: $childMedicationId, medication: $medication) {
                id
                medication {
                  id
                  days
                  sendReminder
                  dose
                  doseAmount
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
      `,
      variables,
    })

    // reset Child Medication
    await ChildMedicationModel.findOneAndUpdate({
      _id: childMedicationId,
    }, {
      $set: {
        sendReminder: false,
        scheduleTime: {
          from: takenFrom,
          to: takenTo,
        },
        dose: '',
        doseAmount: 0,
        medication: medicationId
      }
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          medication: {
            edit: {
              id: childMedicationId,
              medication: {
                id: childMedicationId,
                days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
                sendReminder: true,
                scheduleTime: {
                  from: _takenFrom,
                  to: _takenTo,
                },
                dose: '2mg',
                doseAmount: 2,
                medication: {
                  id: medicationId,
                  name: medicationName,
                  availableDoses: []
                }
              }
            },
          },
        },
      }),
    )
  })

  afterAll(async function () {
    await Promise.all([
      ChildModel.deleteOne({
        _id: childId,
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
