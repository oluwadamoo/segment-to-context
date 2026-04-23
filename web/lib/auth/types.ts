export type Tenant = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  tenant: Tenant;
};

export type SignupResult = AuthSession & {
  apiKey: string;
};

export type LoginResult = AuthSession;

export type AuthEnvelope<T> = {
  status: string;
  data: T;
};

export type SignupFormValues = {
  email: string;
  password: string;
};

export type LoginFormValues = {
  apiKey: string;
};
