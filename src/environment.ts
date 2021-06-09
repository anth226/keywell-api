import 'dotenv/config'

const defaultPort = 4000;

interface Environment {
    apollo: {
        introspection: boolean,
        playground: boolean
    },
    mock: {
        enabled: boolean
    },
    port: number | string;
    mongo: {
        connectionUri: string
    },
    jwtPrivateKey: string,
    encryption: {
        secret: string,
    },
    hashSalt: string
}

if (!process.env.MONGO_CONNECTION_URI) {
    throw new Error('.env.MONGO_CONNECTION_URI is not defined');
}

if (!process.env.JWT_PRIVATE_KEY) {
    throw new Error('.env.JWT_PRIVATE_KEY is not defined');
}

if (!process.env.ENCRYPTION_SECRET) {
    throw new Error('.env.ENCRYPTION_SECRET is not defined');
}

if (!process.env.HASH_SALT) {
    throw new Error('.env.HASH_SALT is not defined');
}

export const environment: Environment = {
    apollo: {
        introspection: process.env.DISABLE_INTROSPECTION !== 'true',
        playground: process.env.DISABLE_PLAYGROUND !== 'true'
    },
    port: process.env.PORT || defaultPort,
    mongo: {
        connectionUri: process.env.MONGO_CONNECTION_URI
    },
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
    encryption: {
        secret: process.env.ENCRYPTION_SECRET,
    },
    mock: {
        enabled: process.env.MOCK === 'true'
    },
    hashSalt: process.env.HASH_SALT
};
