import type { PersonaProfile, StoredPersonaProfile } from "../../domain/persona";

export interface PersonaRepositoryPort {
    upsert(input: { tenantId: string; userId: string; persona: PersonaProfile }): Promise<void>;
    findByTenantAndUserId(input: { tenantId: string; userId: string }): Promise<StoredPersonaProfile | null>;
}
