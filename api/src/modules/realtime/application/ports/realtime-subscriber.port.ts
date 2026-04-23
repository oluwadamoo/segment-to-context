import type {
    TenantEventStreamMessage,
    UserPersonaStreamMessage,
} from "../../domain/realtime-message";

export interface RealtimeSubscriberPort {
    subscribeToTenantEvents(
        tenantId: string,
        onMessage: (message: TenantEventStreamMessage) => void,
    ): () => void;

    subscribeToUserPersona(
        input: { tenantId: string; userId: string },
        onMessage: (message: UserPersonaStreamMessage) => void,
    ): () => void;
}
