import crypto from 'crypto';
import {environment} from '../environment';

export function encrypt(str: string) : Promise<Buffer> {
    return new Promise((resolve, reject) => {
        crypto.scrypt(environment.encryption.secret, 'salt', 24, (err, key) => {
            if (err) throw err;

            crypto.randomFill(new Uint8Array(16), (err, iv) => {
                if (err) throw err;

                const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);

                let encrypted: Uint8Array;

                cipher.on('data', (chunk) => encrypted = encrypted ? Buffer.concat([encrypted, chunk]) : chunk);
                // when encrypted make resolve with a byte array
                // where first 16 bytes is an iv and the rest is an encrypted message
                cipher.on('end', () => resolve(Buffer.concat([iv, encrypted])))
                cipher.on('error', (err) => reject(err))

                cipher.write(str);
                cipher.end();
            });
        });
    })    
}

export function decrypt(data: Uint8Array) : Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.scrypt(environment.encryption.secret, 'salt', 24, (err, key) => {
            if (err) throw err;

            // get an iv from a data byte array
            const iv = data.slice(0, 16);

            const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);

            let decrypted = '';
            decipher.on('readable', () => {
                let chunk;
                while (null !== (chunk = decipher.read())) {
                    decrypted += chunk.toString('utf8');
                }
            });
            decipher.on('end', () => resolve(decrypted));
            decipher.on('error', (err) => reject(err))

            decipher.write(data.slice(16));
            decipher.end();
        });
    });
}
