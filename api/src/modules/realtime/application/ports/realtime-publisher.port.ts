import type {
    TenantEventStreamMessage,
    UserPersonaStreamMessage,
} from "../../domain/realtime-message";

export interface RealtimePublisherPort {
    publishEventIngested(message: TenantEventStreamMessage): Promise<void>;
    publishPersonaUpdated(message: UserPersonaStreamMessage): Promise<void>;
}
