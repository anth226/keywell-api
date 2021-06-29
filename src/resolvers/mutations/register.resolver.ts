import {ApolloError, UserInputError} from 'apollo-server';
import {getJwt, hash} from '../../tools/auth';
import {encrypt} from '../../tools/encryption';
import { UserModel } from '../../db/models';
import type {ResolversContext} from '../../context';
import validator from 'validator';
import isEmail = validator.isEmail;

interface RegisterMutationArgs {
    name: string,
    email: string,
    password: string
}

export default async function register(parent: null, args: RegisterMutationArgs, context: ResolversContext): Promise<string> {
    if (!args.name.trim()) {
        throw new UserInputError('Empty name is not allowed');
    }

    if (!args.email.trim()) {
        throw new UserInputError('Empty email is not allowed');
    }

    if (!args.password.trim()) {
        throw new UserInputError('Empty password is not allowed');
    }

    if (!isEmail(args.email)) {
        throw new UserInputError('Email has an incorrect format');
    }

    const emailHash = hash(args.email);
    const userExisted = await UserModel.findOne({token: emailHash});

    if (userExisted) {
        throw new ApolloError(`User ${args.email} is already registered.`, 'CONFLICT');
    }

    const user = await UserModel.create({
        name: await encrypt(args.name),
        email: await encrypt(args.email),
        token: emailHash,
        password: hash(args.password)
    });

    console.log(`User ${args.email} signed up`);

    return getJwt({
        id: user.id,
        name: args.name,
        email: args.email
    });
}
