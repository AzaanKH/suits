import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
};

export function SectionHeading({
  title,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-6 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div>
        <h2 className="text-ink font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6 sm:text-base sm:leading-7">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link className="text-link shrink-0" href={action.href}>
          {action.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
