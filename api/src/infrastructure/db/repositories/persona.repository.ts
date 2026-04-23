import type { PersonaRepositoryPort } from "../../../modules/persona/application/ports/persona-repository.port";
import { StoredPersonaProfile } from "../../../modules/persona/domain/persona";
import { AppDataSource } from "../data-source";
import { UserPersonaOrmEntity } from "../entities/user-persona.entity";

export class PersonaRepository implements PersonaRepositoryPort {
    private readonly repo = AppDataSource.getRepository(UserPersonaOrmEntity);


    async upsert(input: {
        tenantId: string;
        userId: string;
        persona: {
            personaType: string;
            engagementScore: number;
            keyInterests: string[];
            recommendedAction: string;
        };
    }): Promise<void> {
        await this.repo
            .createQueryBuilder()
            .insert()
            .into(UserPersonaOrmEntity)
            .values({
                tenantId: input.tenantId,
                userId: input.userId,
                persona: input.persona,
            })
            .orUpdate(["persona", "last_updated"], ["tenant_id", "user_id"])
            .execute();
    }

    async findByTenantAndUserId(input: {
        tenantId: string;
        userId: string;
    }): Promise<StoredPersonaProfile | null> {
        const record = await this.repo.findOne({
            where: {
                tenantId: input.tenantId,
                userId: input.userId,
            },
        });

        if (!record) {
            return null;
        }

        return {
            tenantId: record.tenantId,
            userId: record.userId,
            persona: record.persona as StoredPersonaProfile["persona"],
            lastUpdated: record.lastUpdated,
        };
    }

}
