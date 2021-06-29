import {gql} from 'apollo-server';

import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../createTestServer'
import {MedicationModel} from '../../../src/db/models';
import {connectDB} from '../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../helper';

const apolloServerClient = createTestClient(server);

const KNOWN_MEDICATIONS = gql`
    query KnowMedications($q: String) {
        knownMedications(query: $q) {
            id
            name
            availableDoses
        }
    }
`;

describe('knownMedications queries', () => {
  const medicationData = {
    name: 'abc test Keywell is a string',
    availableDoses: ['a', 'b']
  }

  let medicationCreated: any
  beforeAll(async function () {
    await connectDB()
    medicationCreated = await MedicationModel.create({
      ...medicationData
    })

  });

  it('does not accept if not logged in', async () => {
    const res = await apolloServerClient.query({
      query: KNOWN_MEDICATIONS,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('found medication name with empty queries', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {}
    const res = await query({
      query: KNOWN_MEDICATIONS,
      variables
    });

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        knownMedications: [
          {
            id: medicationCreated.id,
            ...medicationData
          },
        ],
      }),
    )
  });

  it('found medication name sensitive with queries in the prefix', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      name: 'Abc',
    }
    const res = await query({
      query: KNOWN_MEDICATIONS,
      variables
    });

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        knownMedications: [
          {
            id: medicationCreated.id,
            ...medicationData
          },
        ],
      }),
    )
  });

  it('found medication name case sensitive with queries in the middle', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      q: 'test keywell'
    }
    const res = await query({
      query: KNOWN_MEDICATIONS,
      variables
    });

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        knownMedications: [
          {
            id: medicationCreated.id,
            ...medicationData
          },
        ],
      }),
    )
  });

  it('found medication name case sensitive with queries in the suffix', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {
      q: 'Is A string'
    }
    const res = await query({
      query: KNOWN_MEDICATIONS,
      variables
    });

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        knownMedications: [
          {
            id: medicationCreated.id,
            ...medicationData
          },
        ],
      }),
    )
  });

  it('found medication name case sensitive & title ordered', async () => {
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    // the first one is 'abc test Keywell is a string'
    // 'aac' should be above of 'abc' although created after
    const medicationData_2 = {
      name: 'aac test Keywell is a string',
    }
    const medicationCreated_2 = await MedicationModel.create({
      ...medicationData_2
    })

    const variables = {
      q: 'Is A string'
    }
    const res = await query({
      query: KNOWN_MEDICATIONS,
      variables
    });

    // delete 2nd medication after invoking queries
    await MedicationModel.deleteOne({
      _id: medicationCreated_2.id
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        knownMedications: [
          {
            id: medicationCreated_2.id,
            ...medicationData_2,
            availableDoses: []
          },
          {
            id: medicationCreated.id,
            ...medicationData
          },
        ],
      }),
    )
  });

  it('found medicationsResolver belong to authenticated user with empty queries and name ordered', async () => {
    const nameMedication2 = 'aac test Keywell is a string'
    const medication2 = await MedicationModel.create({
      name: nameMedication2,
      user: tokenPayload.id,
    })
    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {}
    const res = await query({
      query: KNOWN_MEDICATIONS,
      variables
    });

    await MedicationModel.deleteOne({
      _id: medication2.id
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        knownMedications: [
          {
            id: medication2.id,
            name: nameMedication2,
            availableDoses: []
          },
          {
            id: medicationCreated.id,
            ...medicationData
          },
        ],
      }),
    )
  });

  it('not found medicationsResolver belong to other\'s user with empty queries and name ordered', async () => {
    const nameMedication2 = 'aac test Keywell is a string'
    const medication2 = await MedicationModel.create({
      name: nameMedication2,
      user: tokenPayload.id,
    })
    const medication3 = await MedicationModel.create({
      name: nameMedication2,
      user: tokenPayloadUser2.id
    })

    const {query} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {}
    const res = await query({
      query: KNOWN_MEDICATIONS,
      variables
    });

    await MedicationModel.deleteMany({
      _id: [medication2.id, medication3.id]
    })

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        knownMedications: [
          {
            id: medication2.id,
            name: nameMedication2,
            availableDoses: []
          },
          {
            id: medicationCreated.id,
            ...medicationData
          },
        ],
      }),
    )
  });

  afterAll(async function () {
    await MedicationModel.deleteOne({
      _id: medicationCreated.id
    })
  })
});
