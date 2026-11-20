"use client";

import Image from "next/image";
import { Check, Lock } from "lucide-react";
import { formatPriceModifier } from "@/lib/product-format";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

type OptionCardProps = {
  label: string;
  description: string;
  image?: ProductImage;
  meta?: string;
  swatchColor?: string;
  priceModifierCents: number;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
  onSelect: () => void;
};

export function OptionCard({
  label,
  description,
  image,
  meta,
  priceModifierCents,
  selected,
  swatchColor,
  disabled = false,
  disabledReason,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled}
      className={cn(
        "studio-option",
        selected && "is-selected",
        disabled && "is-disabled",
      )}
      onClick={() => {
        if (!disabled) onSelect();
      }}
    >
      {image ? (
        <span
          className="studio-option-image"
          style={swatchColor ? { backgroundColor: swatchColor } : undefined}
        >
          <Image
            fill
            sizes="(min-width: 1024px) 18vw, 44vw"
            src={
              swatchColor
                ? "/models/suit-studio/textures/wool-albedo.webp"
                : image.src
            }
            alt={image.alt}
            className="object-cover"
            style={swatchColor ? { mixBlendMode: "multiply" } : undefined}
          />
          {selected ? (
            <span className="studio-option-check">
              <Check aria-hidden="true" className="size-3.5" />
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="studio-option-title">
        {label}
        {!image && selected ? (
          <Check aria-hidden="true" className="size-4 shrink-0" />
        ) : null}
      </span>
      <span className="studio-option-description">{description}</span>
      <span className="studio-option-meta">
        {meta ? `${meta} · ` : ""}
        {formatPriceModifier(priceModifierCents)}
      </span>
      {disabledReason ? (
        <span className="studio-option-unavailable">
          <Lock className="size-3 shrink-0" aria-hidden="true" />
          {disabledReason}
        </span>
      ) : null}
    </button>
  );
}
