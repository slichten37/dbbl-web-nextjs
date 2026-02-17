"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "cyan" | "magenta" | "lime" | "amber";

const variantStyles: Record<Variant, string> = {
  cyan: "border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 glow-cyan",
  magenta:
    "border-neon-magenta text-neon-magenta hover:bg-neon-magenta/10 glow-magenta",
  lime: "border-neon-lime text-neon-lime hover:bg-neon-lime/10 glow-lime",
  amber: "border-neon-amber text-neon-amber hover:bg-neon-amber/10 glow-amber",
};

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export default function NeonButton({
  variant = "cyan",
  fullWidth = false,
  className = "",
  children,
  ...props
}: NeonButtonProps) {
  return (
    <button
      className={`rounded-lg border px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
