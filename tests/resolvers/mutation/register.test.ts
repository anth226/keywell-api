import {gql} from 'apollo-server';
import jsonwebtoken from 'jsonwebtoken';

import server from '../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {getDB} from '../../../src/tools/mongo';
import {environment} from '../../../src/environment';
import {hash} from '../../../src/tools/auth';
import {encrypt, decrypt} from '../../../src/tools/encryption';

const apolloServerClient = createTestClient(server);

const REGISTER = gql`
    mutation register($name: String!, $email: String!, $password: String!) {
        register(name: $name, email: $email, password: $password)
    }
`;

describe('register mutation', () => {
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
        const db = await getDB();
        const token = hash('testjwt@email.example');

        const collection = db.collection('users');
        const users = db.collection('users').find({ token });

        let next = await users.next();
        
        while(next) {
            const email = await decrypt(next.email.buffer);
        
            if (email === 'testjwt@email.example') {
                await collection.deleteOne({ _id: next._id });
            }
    
            next = await users.next();
        }

        const res = await apolloServerClient.mutate({
            mutation: REGISTER,
            variables: {
                name: 'name',
                email: 'testjwt@email.example',
                password: 'password'
            }
        });

        const jwt = jsonwebtoken.verify(res.data.register, environment.jwtPrivateKey);
        expect(jwt).toEqual(jasmine.objectContaining({
            name: 'name',
            email: 'testjwt@email.example'
        }));
    });
});
