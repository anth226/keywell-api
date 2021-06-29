import {gql} from 'apollo-server';
import jsonwebtoken from 'jsonwebtoken';

import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {environment} from '../../../src/environment';
import { connectDB } from '../../../src/db';
import { UserModel } from '../../../src/db/models';

const apolloServerClient = createTestClient(server);

const REGISTER = gql`
    mutation register($name: String!, $email: String!, $password: String!) {
        register(name: $name, email: $email, password: $password)
    }
`;

describe('register mutations', () => {
    beforeAll(async function () {
      await connectDB()
    });

    it('does not accept empty name field', async () => {
        const res = await apolloServerClient.mutate({
            mutation: REGISTER,
            variables: {
                name: '   ',
                email: 'test@email.example',
                password: 'password'
            }
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('does not accept empty password field', async () => {
        const res = await apolloServerClient.mutate({
            mutation: REGISTER,
            variables: {
                name: 'name',
                email: 'test@email.example',
                password: '   '
            }
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('validates email', async () => {
        const res = await apolloServerClient.mutate({
            mutation: REGISTER,
            variables: {
                name: 'name',
                email: 'INVALID_EMAIL',
                password: 'password'
            }
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('validates email uniqueness', async () => {
        await apolloServerClient.mutate({
            mutation: REGISTER,
            variables: {
                name: 'name',
                email: 'testuniquenes@email.example',
                password: 'password'
            }
        });

        const res = await apolloServerClient.mutate({
            mutation: REGISTER,
            variables: {
                name: 'name',
                email: 'testuniquenes@email.example',
                password: 'password'
            }
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'CONFLICT'
        }));
    });

    it('returns JWT', async () => {

        const res = await apolloServerClient.mutate({
            mutation: REGISTER,
            variables: {
                name: 'name',
                email: 'testjwt@email.example',
                password: 'password'
            }
        });

        await UserModel.deleteMany()

        const jwt = jsonwebtoken.verify(res.data.register, environment.jwtPrivateKey);
        expect(jwt).toEqual(jasmine.objectContaining({
            name: 'name',
            email: 'testjwt@email.example'
        }));
    });
});
