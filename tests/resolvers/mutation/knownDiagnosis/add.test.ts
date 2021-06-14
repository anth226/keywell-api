import {gql} from 'apollo-server';

import server from '../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../createTestServer'
import { Diagnoses } from '../../../../src/db/models';
import { connectDB } from '../../../../src/db';
import { authorizedHeaders } from '../../../helper';

const apolloServerClient = createTestClient(server);

const ADD_KNOWN_DIAGNOSIS = gql`
    mutation AddKnownDiagnosis($name: String!) {
      knownDiagnosis {
          add(name: $name) {
            id
            diagnosis {
              id
              name
            }
          }
        }
    }
`;

describe('knownDiagnosis.add mutation', () => {
    beforeAll(async function() {
      await connectDB()
    });

    it('does not accept if not logged in', async () => {
        const res = await apolloServerClient.mutate({
            mutation: ADD_KNOWN_DIAGNOSIS,
            variables: {
              name: 'name',
            }
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
            code: 'UNAUTHENTICATED'
        }));
    });

    it('does not accept empty name field', async () => {
        const { mutate } = initServerWithHeaders(server, authorizedHeaders)
        const res = await mutate({
            mutation: ADD_KNOWN_DIAGNOSIS,
            variables: {
              name: '   ',
            },
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors?.[0].message).toEqual('Name must not be empty');
        expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('create new knownDiagnosis successfully', async () => {
        const { mutate } = initServerWithHeaders(server, authorizedHeaders)
        const knownDiagnosisInfo = {
          name: '_test_knownDiagnosis_',
        }
        const res = await mutate({
            mutation: ADD_KNOWN_DIAGNOSIS,
            variables: knownDiagnosisInfo,
        });
        const diagnosesCreatedId = res.data?.knownDiagnosis?.add?.id
        Diagnoses.deleteOne({
          _id: diagnosesCreatedId
        })
          .then((res) => console.log(`Deleted ${res.deletedCount} diagnoses test`))
          .catch((err) => console.error('Failed when delete test diagnoses ', err))

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            knownDiagnosis: {
              add: {
                id: diagnosesCreatedId,
                diagnosis: {
                  id: diagnosesCreatedId,
                  ...knownDiagnosisInfo,
                }
              },
            },
          }),
        )
    });
});