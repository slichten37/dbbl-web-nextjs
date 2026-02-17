"use client";

import { SelectHTMLAttributes } from "react";

type Variant = "cyan" | "magenta" | "lime" | "amber";

const variantStyles: Record<Variant, string> = {
  cyan: "border-neon-cyan/40 focus:border-neon-cyan focus:shadow-[0_0_8px_rgba(0,240,255,0.25)]",
  magenta:
    "border-neon-magenta/40 focus:border-neon-magenta focus:shadow-[0_0_8px_rgba(255,0,229,0.25)]",
  lime: "border-neon-lime/40 focus:border-neon-lime focus:shadow-[0_0_8px_rgba(57,255,20,0.25)]",
  amber:
    "border-neon-amber/40 focus:border-neon-amber focus:shadow-[0_0_8px_rgba(255,191,0,0.25)]",
};

interface NeonSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: Variant;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function NeonSelect({
  variant = "cyan",
  label,
  options,
  placeholder,
  className = "",
  id,
  ...props
}: NeonSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-widest text-foreground/60"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`rounded-lg border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-all duration-200 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
