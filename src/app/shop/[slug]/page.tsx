import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Ruler, Truck } from "lucide-react";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { getProductBySlug, products } from "@/data/products";
import { formatBasePrice, formatPriceModifier } from "@/lib/product-format";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <PageContainer className="py-8 sm:py-12 lg:py-16">
        <Link
          className="text-link text-muted-foreground hover:text-ink"
          href="/shop"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to suits
        </Link>
        <div className="mt-7 grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <ProductImageGallery images={product.images} />
          <div className="lg:py-4">
            <h1 className="text-ink font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-7xl">
              {product.name}
            </h1>
            <p className="text-muted-foreground mt-3 text-sm font-bold tracking-[0.08em] uppercase">
              {product.color}
            </p>
            <p className="text-ink mt-7 text-lg font-semibold">
              {formatBasePrice(product)}
            </p>
            <p className="text-muted-foreground mt-7 max-w-xl text-base leading-7">
              {product.description}
            </p>
            <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
              {product.details}
            </p>

            <div className="border-border mt-8 grid gap-4 border-y py-6 sm:grid-cols-2">
              <div className="flex gap-3">
                <Ruler
                  aria-hidden="true"
                  className="text-accent-strong mt-0.5 size-5 shrink-0"
                />
                <div>
                  <p className="text-ink text-sm font-bold">Made for you</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-5">
                    Cut to your measurements and preferences.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Truck
                  aria-hidden="true"
                  className="text-accent-strong mt-0.5 size-5 shrink-0"
                />
                <div>
                  <p className="text-ink text-sm font-bold">
                    Delivered in 4-6 weeks
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-5">
                    Timing is confirmed after your fitting.
                  </p>
                </div>
              </div>
            </div>

            <Link
              className="button-primary mt-8 w-full sm:w-auto"
              href="/contact"
            >
              Begin customization
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              Customize details online with a stylist-guided fitting to follow.
            </p>
          </div>
        </div>
      </PageContainer>

      <section className="bg-stone border-border border-y py-16 sm:py-20">
        <PageContainer className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 className="text-ink max-w-md font-serif text-5xl leading-[0.98] tracking-[-0.035em]">
              {product.fabric.name}
            </h2>
            <p className="text-muted-foreground mt-5 max-w-md text-sm leading-6">
              {product.fabric.description}
            </p>
          </div>
          <dl className="border-border divide-border grid h-fit grid-cols-2 border-t text-sm sm:grid-cols-4 sm:divide-x">
            {[
              ["Mill", product.fabric.mill],
              ["Composition", product.fabric.composition],
              ["Weight", product.fabric.weight],
              ["Season", product.fabric.seasonality],
            ].map(([label, value]) => (
              <div className="border-border border-b py-5 sm:px-5" key={label}>
                <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                  {label}
                </dt>
                <dd className="text-ink mt-2 leading-5">{value}</dd>
              </div>
            ))}
          </dl>
        </PageContainer>
      </section>

      <section className="py-16 sm:py-20">
        <PageContainer>
          <h2 className="text-ink max-w-2xl font-serif text-5xl leading-[0.98] tracking-[-0.035em]">
            Make the house cut your own.
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {product.customizationOptions.map((option) => (
              <article className="border-border border p-5" key={option.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                    {option.group}
                  </p>
                  <Check
                    aria-hidden="true"
                    className="text-accent-strong size-4"
                  />
                </div>
                <h3 className="text-ink mt-5 font-serif text-3xl leading-none">
                  {option.name}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {option.description}
                </p>
                <p className="text-ink mt-5 text-xs font-bold tracking-[0.08em] uppercase">
                  {formatPriceModifier(option.priceModifier)}
                </p>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
