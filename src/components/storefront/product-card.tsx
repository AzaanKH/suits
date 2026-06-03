import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ProductSummary } from "@/types";

import { PriceDisplay } from "./price-display";

type ProductCardProps = {
  product: ProductSummary;
};

const fallbackProductImage = {
  src: "/images/hero-tailoring.png",
  alt: "Tailored suit placeholder",
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ?? fallbackProductImage;

  return (
    <article>
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="bg-stone relative aspect-[2/3] overflow-hidden">
          <Image
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
            src={image.src}
            alt={image.alt}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          />
          {product.badge ? (
            <span className="bg-ivory text-ink absolute top-3 left-3 px-3 py-2 text-xs font-bold tracking-[0.1em] uppercase">
              {product.badge}
            </span>
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-4 pt-4">
          <div>
            <h3 className="text-ink group-hover:text-accent-strong font-serif text-[1.75rem] leading-none tracking-[-0.02em] transition-colors">
              {product.name}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {product.color}
            </p>
            <PriceDisplay
              priceCents={product.basePriceCents}
              prefix="From "
              className="mt-3"
            />
          </div>
          <span
            className="border-border text-ink group-hover:bg-ink group-hover:text-ivory mt-4 inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors"
            aria-hidden="true"
          >
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </span>
        </div>
      </Link>
    </article>
  );
}
