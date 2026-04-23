export type PersonaProfile = {
    personaType: string;
    engagementScore: number;
    keyInterests: string[];
    recommendedAction: string;
};


export type StoredPersonaProfile = {
    tenantId: string;
    userId: string;
    persona: PersonaProfile;
    lastUpdated: Date;
};