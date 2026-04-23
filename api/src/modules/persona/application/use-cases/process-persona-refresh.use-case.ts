import type { EventRepositoryPort } from "../../../events/application/ports/event-repository.port";
import { RealtimePublisherPort } from "../../../realtime/application/ports/realtime-publisher.port";
import type { PersonaModelPort } from "../ports/persona-model.port";
import type { PersonaRepositoryPort } from "../ports/persona-repository.port";

export class ProcessPersonaRefreshUseCase {
    constructor(
        private readonly eventRepository: EventRepositoryPort,
        private readonly personaRepository: PersonaRepositoryPort,
        private readonly personaModel: PersonaModelPort,
        private readonly realtimePublisher: RealtimePublisherPort,
    ) { }

    async execute(input: { tenantId: string; userId: string }) {
        const recentEvents = await this.eventRepository.getRecentUnprocessedByUser({
            tenantId: input.tenantId,
            userId: input.userId,
            limit: 50,
        });

        if (recentEvents.length === 0) {
            return { processedCount: 0 };
        }

        const persona = await this.personaModel.generateFromEvents(recentEvents);

        await this.personaRepository.upsert({
            tenantId: input.tenantId,
            userId: input.userId,
            persona,
        });

        await this.realtimePublisher.publishPersonaUpdated({
            type: "persona.updated",
            tenantId: input.tenantId,
            userId: input.userId,
            persona,
            lastUpdated: new Date().toISOString(),
        });

        await this.eventRepository.markProcessed(recentEvents.map((event) => event.id));

        return { processedCount: recentEvents.length };
    }
}
