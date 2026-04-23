export interface PasswordHasherPort {
    hash(value: string): Promise<string>;
    verify(value: string, storedHash: string): Promise<boolean>;
}
