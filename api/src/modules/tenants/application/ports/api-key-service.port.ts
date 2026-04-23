export interface ApiKeyServicePort {
    generate(): string;
    hash(apiKey: string): string;
}
