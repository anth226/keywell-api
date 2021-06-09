import {gql} from 'apollo-server';

import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {getDB} from '../../../src/tools/mongo';
import {hash, verifyJwt} from '../../../src/tools/auth';
import {encrypt} from '../../../src/tools/encryption';

export const LOGIN = gql`
    mutation ($email: String!, $password: String!) {
        login(email: $email, password: $password)
    }
`;

const apolloServerClient = createTestClient(server);

describe('login mutation', () => {
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
        const db = await getDB();

        const collection = db.collection('users');

        const tempData = await collection.insertOne({
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

        await collection.deleteOne({
            _id: tempData.insertedId
        });

        expect(res.errors!.length).toBe(1);
        expect(res.errors![0].message).toEqual('User not found');
        expect(res.errors![0].extensions).toEqual(jasmine.objectContaining({
            code: 'BAD_USER_INPUT'
        }));
    });

    it('returns JWT', async () => {
        const db = await getDB();

        const collection = db.collection('users');

        const tempData = await collection.insertOne({
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

        await collection.deleteOne({
            _id: tempData.insertedId
        });

        const jwt = verifyJwt(res.data.login);
        expect(jwt).toEqual(jasmine.objectContaining({
            id: jasmine.any(String),
            name: 'name',
            email: 'test@email.example'
        }));
    });
});
