import * as argon from "argon2";

import { PasswordHasherPort } from "../../modules/tenants/application/ports/password-hasher.port";

export class PasswordHasher implements PasswordHasherPort {
    async hash(pass: string): Promise<string> {
        const password = await argon.hash(pass);
        return password;
    }

    async verify(value: string, storedHash: string): Promise<boolean> {
        const passwordMatches = await argon.verify(
            storedHash,
            value
        );
        return passwordMatches;
    }

}