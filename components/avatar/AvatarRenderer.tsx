"use client";

import type { AvatarConfig } from "@/lib/db/types";
import { cn } from "@/lib/utils";

type AvatarRendererProps = {
  config: AvatarConfig;
  size?: "small" | "medium" | "large";
  className?: string;
  onClick?: () => void;
};

const sizeClass = {
  small: "h-16 w-16",
  medium: "h-28 w-28",
  large: "h-44 w-44"
};

const outfits: Record<AvatarConfig["outfit"], string> = {
  hoodie: "#8B5CF6",
  shirt: "#60A5FA",
  dress: "#F472B6",
  jacket: "#2A2A2A"
};

export function AvatarRenderer({ config, size = "medium", className, onClick }: AvatarRendererProps) {
  const smilePath =
    config.expression === "sleepy"
      ? "M38 51 Q50 46 62 51"
      : config.expression === "excited"
        ? "M37 50 Q50 65 63 50"
        : config.expression === "calm"
          ? "M40 54 H60"
          : "M39 51 Q50 60 61 51";

  const avatar = (
    <svg viewBox="0 0 100 120" className="h-full w-full drop-shadow-md" role="img">
      <rect x="24" y="70" width="52" height="42" rx="14" fill={outfits[config.outfit]} stroke="#2A2A2A" strokeWidth="4" />
      <circle cx="50" cy="45" r="28" fill={config.skinColor} stroke="#2A2A2A" strokeWidth="4" />
      {config.hairStyle === "short" ? (
        <path d="M25 39 C30 13 70 13 75 39 C63 32 42 32 25 39Z" fill={config.hairColor} stroke="#2A2A2A" strokeWidth="4" />
      ) : null}
      {config.hairStyle === "bob" ? (
        <path d="M22 43 C22 14 78 14 78 43 L72 68 C59 61 39 61 28 68Z" fill={config.hairColor} stroke="#2A2A2A" strokeWidth="4" />
      ) : null}
      {config.hairStyle === "curly" ? (
        <path d="M23 43 C20 20 38 13 50 15 C65 10 82 24 76 45 C66 36 36 36 23 43Z" fill={config.hairColor} stroke="#2A2A2A" strokeWidth="4" />
      ) : null}
      {config.hairStyle === "long" ? (
        <path d="M22 44 C22 12 78 12 78 44 L84 92 C68 80 33 80 16 92Z" fill={config.hairColor} stroke="#2A2A2A" strokeWidth="4" />
      ) : null}
      <circle cx="39" cy="44" r="3.5" fill="#2A2A2A" />
      <circle cx="61" cy="44" r="3.5" fill="#2A2A2A" />
      <path d={smilePath} fill="none" stroke="#2A2A2A" strokeLinecap="round" strokeWidth="4" />
      {config.accessory === "glasses" ? (
        <path d="M30 43 H47 M53 43 H70 M47 43 Q50 41 53 43" fill="none" stroke="#2A2A2A" strokeWidth="3" />
      ) : null}
      {config.accessory === "hat" ? (
        <path d="M29 22 H71 L64 8 H36Z" fill="#F59E0B" stroke="#2A2A2A" strokeLinejoin="round" strokeWidth="4" />
      ) : null}
    </svg>
  );

  if (onClick) {
    return (
      <button
        aria-label="friend avatar"
        className={cn("inline-flex items-center justify-center rounded-full", sizeClass[size], className)}
        onClick={onClick}
        type="button"
      >
        {avatar}
      </button>
    );
  }

  return (
    <div aria-label="friend avatar" className={cn("inline-flex items-center justify-center rounded-full", sizeClass[size], className)}>
      {avatar}
    </div>
  );
}
