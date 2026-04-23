"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/auth/schemas";
import type { LoginFormValues } from "@/lib/auth/types";

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => Promise<void>;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  async function submit(values: LoginFormValues) {
    setFormError(null);

    try {
      await onSubmit(values);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in right now."
      );
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div className="space-y-2">
        <label
          htmlFor="apiKey"
          className="text-sm font-medium text-foreground"
        >
          API key
        </label>
        <Input
          id="apiKey"
          placeholder="stc_xxxxxxxxxxxxxxxxx"
          autoComplete="off"
          {...register("apiKey")}
        />
        {errors.apiKey ? (
          <p className="text-sm text-destructive">{errors.apiKey.message}</p>
        ) : null}
      </div>

      {formError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
