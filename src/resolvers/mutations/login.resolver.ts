import {UserInputError} from 'apollo-server';
import {getJwt, hash} from '../../tools/auth';
import {decrypt} from '../../tools/encryption';

import type {ResolversContext} from '../../context';
import validator from 'validator';
import isEmail = validator.isEmail;
import { UserModel } from '../../db/models';

interface LoginMutationArgs {
    email: string,
    password: string
}

export default async function (parent: null, args: LoginMutationArgs, context: ResolversContext): Promise<string> {
    const email = args.email.trim();
    if (!email) {
        throw new UserInputError('Email must not be empty');
    }
    if (!isEmail(email)) {
        throw new UserInputError('Email is invalid');
    }

    if (!args.password.trim()) {
        throw new UserInputError('Password must not be empty');
    }

    const emailHash = hash(args.email);
    const passwordHash = hash(args.password);

    const user = await UserModel.findOne({
        token: emailHash,
        password: passwordHash
    });

    if (!user) {
        console.log(`User ${args.email} sign in failed`);
        throw new UserInputError('User not found');
    }

    console.log(`User ${args.email} signed in`);

    return getJwt({
        id: user._id,
        name: await decrypt(user.get('name', Buffer)),
        email: await decrypt(user.get('email', Buffer)),
    });
}
