import {gql} from 'apollo-server';

import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {hash, verifyJwt} from '../../../src/tools/auth';
import {encrypt} from '../../../src/tools/encryption';
import { connectDB } from '../../../src/db';
import { UserModel } from '../../../src/db/models';

export const LOGIN = gql`
    mutation ($email: String!, $password: String!) {
        login(email: $email, password: $password)
    }
`;

const apolloServerClient = createTestClient(server);

describe('login mutations', () => {
    beforeAll(async function () {
      await connectDB()
    });

    it('requires not empty email', async () => {

        const res = await apolloServerClient.mutate({
            mutation: LOGIN,
            variables: {
                email: '   ',
                password: 'somesecret'
            }
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].message).toEqual('Email must not be empty');
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('requires valid email', async () => {

        const res = await apolloServerClient.mutate({
            mutation: LOGIN,
            variables: {
                email: 'invalid',
                password: 'somesecret'
            }
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].message).toEqual('Email is invalid');
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('requires not empty password', async () => {

        const res = await apolloServerClient.mutate({
            mutation: LOGIN,
            variables: {
                email: 'some@email.com',
                password: '   '
            }
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].message).toEqual('Password must not be empty');
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('checks credentials', async () => {
        const tempData = await UserModel.create({
            token: hash('test@email.example'),
            password: hash('password')
        });

        const res = await apolloServerClient.mutate({
            mutation: LOGIN,
            variables: {
                email: 'test@email.example',
                password: 'INVALID_PASSWORD'
            }
        });

        await UserModel.deleteOne({
            _id: tempData.id
        });

        expect(res.errors?.length).toBe(1);
        expect(res.errors![0].message).toEqual('User not found');
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('returns JWT', async () => {
        const tempData = await UserModel.create({
            token: hash('test@email.example'),
            email: await encrypt('test@email.example'),
            name: await encrypt('name'),
            password: hash('password')
        });

        const res = await apolloServerClient.mutate({
            mutation: LOGIN,
            variables: {
                email: 'test@email.example',
                password: 'password'
            }
        });

        await UserModel.deleteOne({
            _id: tempData.id
        });

        const jwt = verifyJwt(res.data.login);
        expect(jwt).toEqual(jasmine.objectContaining({
            id: jasmine.any(String),
            name: 'name',
            email: 'test@email.example'
        }));
    });
});
