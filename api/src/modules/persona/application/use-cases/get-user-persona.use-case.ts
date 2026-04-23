import type { PersonaRepositoryPort } from "../ports/persona-repository.port";

export class GetUserPersonaUseCase {
    constructor(private readonly personaRepository: PersonaRepositoryPort) { }

    async execute(input: { tenantId: string; userId: string }) {
        return this.personaRepository.findByTenantAndUserId(input);
    }
}