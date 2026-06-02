"use client";

import Image from "next/image";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/data/products";
import { useCartStore } from "@/store/cart-store";

import { PriceDisplay } from "./price-display";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <article className="group">
      <div className="bg-stone relative aspect-[2/3] overflow-hidden">
        <Image
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
          src={product.image}
          alt={product.imageAlt}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
        {product.badge ? (
          <span className="bg-ivory text-ink absolute top-3 left-3 px-3 py-2 text-sm font-bold tracking-[0.08em] uppercase">
            {product.badge}
          </span>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-4 pt-4">
        <div>
          <h3 className="text-ink font-serif text-[1.75rem] leading-none tracking-[-0.02em]">
            {product.name}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">{product.color}</p>
          <PriceDisplay price={product.price} className="mt-3" />
        </div>
        <Button
          type="button"
          data-testid={`add-to-cart-${product.id}`}
          aria-label={`Add ${product.name} in ${product.color} to cart`}
          className="bg-ink hover:bg-accent hover:text-ink mt-5 size-10 rounded-full"
          onClick={() => addItem(product)}
          size="icon"
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </article>
  );
}
