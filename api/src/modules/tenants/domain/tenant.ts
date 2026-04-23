import { z } from "zod";

export const TenantSignupSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const TenantLoginSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type TenantSignupDTO = z.infer<typeof TenantSignupSchema>;
export type TenantLoginDTO = z.infer<typeof TenantLoginSchema>;


export type TenantRecord = {
    id: string;
    email: string;
    passwordHash: string;
    apiKeyHash: string;
    createdAt: Date;
    updatedAt: Date;
};

export type TenantPublic = {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};

export type AuthenticatedTenant = {
    tenantId: string;
    email: string;
};