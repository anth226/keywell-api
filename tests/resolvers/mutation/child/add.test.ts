import {gql} from 'apollo-server';

import server from '../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import { initServerWithHeaders } from '../../../createTestServer'
import { Children } from '../../../../src/db/models';
import { connectDB } from '../../../../src/db';

const apolloServerClient = createTestClient(server);

const ADD_CHILD = gql`
    mutation AddChild($name: String!, $age: Int!) {
        child {
          add(input: {
            name: $name,
            age: $age
          }) {
            id
            child {
              id
              name
              age
            }
          }
        }
    }
`;

describe('addChild mutation', () => {
    beforeAll(async function() {
      await connectDB()
    });

    it('does not accept if not logged in', async () => {
        const res = await apolloServerClient.mutate({
            mutation: ADD_CHILD,
            variables: {
              name: 'name',
              age: 10
            }
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
            code: 'UNAUTHENTICATED'
        }));
    });

    it('does not accept empty name field', async () => {
        const { mutate } = initServerWithHeaders(server, 
          {
            authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYWY5YWU5OGRlZWIzN2IzM2RmOWQwZCIsIm5hbWUiOiJuYW1lIiwiZW1haWwiOiJ0ZXN0QGVtYWlsLmV4YW1wbGUiLCJpYXQiOjE2MjIxOTc0Nzd9.K7sev9ZDLcXXwZwBYdk3CaqQ7Bz2ifpshD7A3wnxUX8'
          }
        )
        const res = await mutate({
            mutation: ADD_CHILD,
            variables: {
              name: '   ',
              age: 10
            },
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors?.[0].message).toEqual('Name must not be empty');
        expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('does not accept if age < 1', async () => {
        const { mutate } = initServerWithHeaders(server, 
          {
            authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYWY5YWU5OGRlZWIzN2IzM2RmOWQwZCIsIm5hbWUiOiJuYW1lIiwiZW1haWwiOiJ0ZXN0QGVtYWlsLmV4YW1wbGUiLCJpYXQiOjE2MjIxOTc0Nzd9.K7sev9ZDLcXXwZwBYdk3CaqQ7Bz2ifpshD7A3wnxUX8'
          }
        )
        const res = await mutate({
            mutation: ADD_CHILD,
            variables: {
              name: 'valid name',
              age: 0
            },
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors?.[0].message).toEqual('Age cannot be less than 1 or greater than 100');
        expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('does not accept if age > 100', async () => {

        const { mutate } = initServerWithHeaders(server, 
          {
            authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYWY5YWU5OGRlZWIzN2IzM2RmOWQwZCIsIm5hbWUiOiJuYW1lIiwiZW1haWwiOiJ0ZXN0QGVtYWlsLmV4YW1wbGUiLCJpYXQiOjE2MjIxOTc0Nzd9.K7sev9ZDLcXXwZwBYdk3CaqQ7Bz2ifpshD7A3wnxUX8'
          }
        )
        const res = await mutate({
            mutation: ADD_CHILD,
            variables: {
              name: 'valid name',
              age: 101
            },
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors?.[0].message).toEqual('Age cannot be less than 1 or greater than 100');
        expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('create new child successfully', async () => {
        const { mutate } = initServerWithHeaders(server, 
          {
            authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYWY5YWU5OGRlZWIzN2IzM2RmOWQwZCIsIm5hbWUiOiJuYW1lIiwiZW1haWwiOiJ0ZXN0QGVtYWlsLmV4YW1wbGUiLCJpYXQiOjE2MjIxOTc0Nzd9.K7sev9ZDLcXXwZwBYdk3CaqQ7Bz2ifpshD7A3wnxUX8'
          }
        )
        const childInfo = {
          name: '_test_children_',
          age: 100
        }
        const res = await mutate({
            mutation: ADD_CHILD,
            variables: childInfo,
        });
        const childCreatedId = res.data?.child?.add?.id
        Children.deleteOne({
          _id: childCreatedId
        })
          .then((res) => console.log(`Deleted ${res.deletedCount} children test`))
          .catch((err) => console.error('Failed when delete test children ', err))

        expect(res.errors).toBe(undefined);
        expect(res.data).toEqual(
          jasmine.objectContaining({
            child: {
              add: {
                id: childCreatedId,
                child: {
                  id: childCreatedId,
                  ...childInfo,
                }
              },
            },
          }),
        )
    });
});