import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ProductSummary } from "@/types";

import { PriceDisplay } from "./price-display";

type ProductCardProps = {
  product: ProductSummary;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="bg-stone relative aspect-[2/3] overflow-hidden">
          <Image
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
            src={product.images[0].src}
            alt={product.images[0].alt}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          />
          {product.badge ? (
            <span className="bg-ivory text-ink absolute top-3 left-3 px-3 py-2 text-xs font-bold tracking-[0.1em] uppercase">
              {product.badge}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex items-start justify-between gap-4 pt-4">
        <div>
          <h3>
            <Link
              className="text-ink hover:text-accent-strong font-serif text-[1.75rem] leading-none tracking-[-0.02em] transition-colors"
              href={`/shop/${product.slug}`}
            >
              {product.name}
            </Link>
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">{product.color}</p>
          <PriceDisplay
            priceCents={product.basePriceCents}
            prefix="From "
            className="mt-3"
          />
        </div>
        <Link
          href={`/shop/${product.slug}`}
          className="border-border text-ink hover:bg-ink hover:text-ivory mt-4 inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors"
          aria-label={`View ${product.name} in ${product.color}`}
        >
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}
