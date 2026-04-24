import type { EventRepositoryPort } from "../ports/event-repository.port";

export class GetEventHistoryUseCase {
    constructor(private readonly eventRepository: EventRepositoryPort) { }

    async execute(input: {
        tenantId: string;
        limit: number;
        cursor?: {
            createdAt: Date;
            id: string;
        };
    }) {
        return this.eventRepository.listHistoryByTenant(input);
    }
}
