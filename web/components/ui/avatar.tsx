import type * as React from "react";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10",
        className
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center text-sm font-semibold text-primary",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback };
