"use client";

import Image from "next/image";
import { Check, Lock } from "lucide-react";
import type { KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPriceModifier } from "@/lib/product-format";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

type OptionCardProps = {
  label: string;
  description: string;
  image?: ProductImage;
  eyebrow?: string;
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
  eyebrow,
  priceModifierCents,
  selected,
  disabled = false,
  disabledReason,
  onSelect,
}: OptionCardProps) {
  function handleSelect() {
    if (!disabled) {
      onSelect();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        "rounded-lg py-0 transition-all",
        disabled
          ? "bg-muted/50 cursor-not-allowed opacity-60"
          : "hover:border-foreground/30 cursor-pointer hover:shadow-sm",
        selected && "border-primary ring-primary/30 ring-2",
      )}
    >
      {image ? (
        <div className="bg-stone relative aspect-[4/3] overflow-hidden rounded-t-lg">
          <Image
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw"
            src={image.src}
            alt={image.alt}
            className="object-cover"
          />
        </div>
      ) : null}
      <CardHeader className="pt-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-muted-foreground mb-2 text-xs font-bold tracking-[0.1em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <CardTitle className="text-ink font-serif text-3xl leading-none">
              {label}
            </CardTitle>
          </div>
          <CardAction>
            {selected ? (
              <Badge className="gap-1" aria-label="Selected">
                <Check className="size-3" aria-hidden="true" />
                Selected
              </Badge>
            ) : disabled ? (
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" aria-hidden="true" />
                Unavailable
              </Badge>
            ) : null}
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <CardDescription className="leading-6">{description}</CardDescription>
        <p className="text-ink mt-4 text-xs font-bold tracking-[0.08em] uppercase">
          {formatPriceModifier(priceModifierCents)}
        </p>
        {disabledReason ? (
          <p className="text-muted-foreground mt-3 border-t pt-3 text-xs leading-5">
            {disabledReason}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
