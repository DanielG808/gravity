"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "warn";
};

export default function Button({
  className,
  variant = "default",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition",
        variant === "default" && "bg-white/10 hover:bg-white/15 text-white",
        variant === "ghost" && "bg-transparent hover:bg-white/5 text-white",
        variant === "warn" && "bg-red-500/15 hover:bg-red-500/25 text-red-100",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}
