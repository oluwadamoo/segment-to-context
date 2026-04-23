import { apiRequest } from "@/lib/api";
import type {
  AuthEnvelope,
  LoginFormValues,
  LoginResult,
  SignupFormValues,
  SignupResult,
} from "@/lib/auth/types";

export async function signupTenant(
  values: SignupFormValues
): Promise<SignupResult> {
  const response = await apiRequest<AuthEnvelope<SignupResult>>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(values),
  });

  return response.data;
}

export async function loginTenant(
  values: LoginFormValues
): Promise<LoginResult> {
  const response = await apiRequest<AuthEnvelope<LoginResult>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(values),
  });

  return response.data;
}
