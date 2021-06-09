import {MongoClient} from 'mongodb';

import type {Db} from 'mongodb';
import {environment} from '../environment';

let mongoClient, db: Db;

export async function getDB(): Promise<Db> {
    if (db) {
        return db;
    }

    mongoClient = new MongoClient(environment.mongo.connectionUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await mongoClient.connect();

    db = mongoClient.db();

    return db;
}
