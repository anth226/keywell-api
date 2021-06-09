import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import { AuthenticationError } from 'apollo-server'
import { skip } from 'graphql-resolvers'
import {environment} from '../environment';
import type {ResolversContext} from '../context';


export interface UserData {
    id: string,
    name: string,
    email: string
}

export function getJwt(data : UserData) : string {
    return jsonwebtoken.sign(data, environment.jwtPrivateKey);
}

export function verifyJwt(token : string) : UserData {
    return jsonwebtoken.verify(token, environment.jwtPrivateKey) as UserData;
}

export function hash(str : string) : string {
    return crypto.createHash('md5').update(str + environment.hashSalt).digest('hex');
}


export function isAuthenticated<T1, T2>(parent: T1, args: T2, ctx: ResolversContext){
  return ctx.me && ctx.me.id ? skip : new AuthenticationError('Not authenticated')
}
