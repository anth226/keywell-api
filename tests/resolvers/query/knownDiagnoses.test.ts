import {gql} from 'apollo-server';

import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import { initServerWithHeaders } from '../../createTestServer'
import { Diagnoses } from '../../../src/db/models';
import { connectDB } from '../../../src/db';
import { authorizedHeaders, tokenPayload, tokenPayloadUser2 } from '../../helper';

const apolloServerClient = createTestClient(server);

const KNOWN_DIAGNOSES = gql`
    query KnowDiagnoses($q: String) {
      knownDiagnoses(query: $q) {
        id
        name
      }
    }
`;

describe('knownDiagnoses query', () => {
  const diagnosisData = {
    name: 'abc test Keywell is a string',
  }
  let diagnosisCreated: any
  
    beforeAll(async function() {
      await connectDB()
      diagnosisCreated = await Diagnoses.create({
        ...diagnosisData,
        user_id: tokenPayload.id
      })

    });

    it('does not accept if not logged in', async () => {
        const res = await apolloServerClient.query({
            query: KNOWN_DIAGNOSES,
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
            code: 'UNAUTHENTICATED'
        }));
    });

    it('found diagnose name with empty query', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        const variables = {}
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    it('found diagnose name sensitive with query in the prefix', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        const variables = {
          name: 'Abc',
        }
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    it('found diagnose name case sensitive with query in the middle', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        const variables = {
          q: 'test keywell'
        }
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    it('found diagnose name case sensitive with query in the suffix', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        const variables = {
          q: 'Is A string'
        }
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    it('found diagnose name case sensitive & title ordered', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        // the first one is 'abc test Keywell is a string'
        // 'aac' should be above of 'abc' although created after
        const diagnosisData_2 = {
          name: 'aac test Keywell is a string',
        }
        const diagnosisCreated_2 = await Diagnoses.create({
          ...diagnosisData_2,
          user_id: tokenPayload.id
        })

        const variables = {
          q: 'Is A string'
        }
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        // delete 2nd diagnoses after invoking query
        await Diagnoses.deleteOne({
          _id: diagnosisCreated_2.id
        })

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisCreated_2.id,
                ...diagnosisData_2,
              },
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    it('found diagnose name case belonged to user & public diagnose', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        // this is public diagnosis because it doesn't have user_id
        const diagnosisData_2 = {
          name: 'aac test Keywell is a string',
        }
        const diagnosisDataPublic = await Diagnoses.create({
          ...diagnosisData_2
        })

        const variables = {
          q: 'Is A string'
        }
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        // delete 2nd diagnoses after invoking query
        await Diagnoses.deleteOne({
          _id: diagnosisDataPublic.id
        })

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisDataPublic.id,
                ...diagnosisData_2,
              },
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    it('found diagnose name case belonged to user & not found diagnose of another user', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        // this is user2's diagnosis because of user_id existence
        const diagnosisData_2 = {
          name: 'aac test Keywell is a string',
        }
        const diagnosisDataPublicCreated = await Diagnoses.create({
          ...diagnosisData_2,
          user_id: tokenPayloadUser2.id
        })

        const variables = {
          q: 'Is A string'
        }
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        // delete 2nd diagnoses after invoking query
        await Diagnoses.deleteOne({
          _id: diagnosisDataPublicCreated.id
        })

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    it('found diagnose name case belonged to user & public diagnose & not found diagnose of another user', async () => {
        const { query } = initServerWithHeaders(server, authorizedHeaders)
        // this is public diagnosis because it doesn't have user_id
        const diagnosisDataPublic = {
          name: 'aac test Keywell is a string',
        }
        const diagnosisDataPublicCreated = await Diagnoses.create({
          ...diagnosisDataPublic,
        })

        // this is user2's diagnosis because of user_id existence
        const diagnosisDataUser2 = {
          name: 'aac test Keywell is a string',
        }
        const diagnosisDataUser2Created = await Diagnoses.create({
          ...diagnosisDataUser2,
          user_id: tokenPayloadUser2.id
        })

        const variables = {
          q: 'Is A string'
        }
        const res = await query({
            query: KNOWN_DIAGNOSES,
            variables
        });

        // delete 2nd diagnoses after invoking query
        await Diagnoses.deleteMany({
          _id: {
            $in: [diagnosisDataPublicCreated.id, diagnosisDataUser2Created.id]
          }
        })

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnoses: [
              {
                id: diagnosisDataPublicCreated.id,
                ...diagnosisDataPublic,
              },
              {
                id: diagnosisCreated.id,
                ...diagnosisData
              },
            ],
          }),
        )
    });

    afterAll(async function(){
      await Diagnoses.deleteOne({
        _id: diagnosisCreated.id
      })
    })
});