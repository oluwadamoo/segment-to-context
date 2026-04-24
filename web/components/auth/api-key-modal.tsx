"use client";

import { useState } from "react";
import { CheckCircle2, Copy, KeyRound, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ApiKeyModalProps = {
  tenantEmail: string;
  onClose: () => void;
  onGenerate: () => Promise<string>;
};

export function ApiKeyModal({
  tenantEmail,
  onClose,
  onGenerate,
}: ApiKeyModalProps) {
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      const nextApiKey = await onGenerate();
      setGeneratedApiKey(nextApiKey);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate a new API key right now."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!generatedApiKey) {
      return;
    }

    await navigator.clipboard.writeText(generatedApiKey);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/95 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Tenant settings
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              API key controls
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Generate a new SDK API key for{" "}
              <span className="font-medium text-foreground">{tenantEmail}</span>.
              The previous key should be considered replaced once you rotate it.
            </p>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <KeyRound className="size-4 text-primary" />
              Current action
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Click generate when you are ready to issue a fresh API key for your
              website or SDK integration.
            </p>
          </div>

          {generatedApiKey ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" />
                New API key generated
              </div>
              <div className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-sm break-all text-foreground">
                {generatedApiKey}
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {isGenerating ? "Generating..." : "Generate new API key"}
            </Button>

            <Button
              className="flex-1"
              variant="outline"
              onClick={generatedApiKey ? handleCopy : onClose}
              disabled={isGenerating}
            >
              {generatedApiKey ? <Copy className="size-4" /> : null}
              {generatedApiKey ? (copied ? "Copied" : "Copy API key") : "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
