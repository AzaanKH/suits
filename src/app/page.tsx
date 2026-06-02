import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { products } from "@/data/products";

const process = [
  {
    number: "01",
    title: "Choose your cloth",
    description:
      "Begin with a considered edit of all-season wools, textured separates, and occasion fabrics.",
  },
  {
    number: "02",
    title: "Refine the details",
    description:
      "Select the lapel, lining, buttons, and finishing touches that make the garment yours.",
  },
  {
    number: "03",
    title: "Made for your frame",
    description:
      "Your measurements are translated into a balanced, personal fit by our tailoring team.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-border bg-stone border-b">
        <PageContainer className="grid min-h-[calc(100svh-5rem)] items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-16">
          <div className="max-w-2xl py-8 lg:py-16">
            <h1 className="text-ink mt-6 font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-7xl lg:text-[6.75rem]">
              Clothes that hold their line.
            </h1>
            <p className="text-muted-foreground mt-7 max-w-lg text-base leading-7 sm:text-lg sm:leading-8">
              Custom suiting for a life in motion. Designed with restraint, cut
              for your proportions, and made to wear beautifully over time.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="button-primary" href="/shop">
                Explore the collection
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link className="button-secondary" href="/about">
                Our approach
              </Link>
            </div>
          </div>
          <div className="bg-clay relative mx-auto aspect-[3/4] w-full max-w-2xl overflow-hidden lg:ml-auto">
            <Image
              priority
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              src="/images/hero-tailoring.png"
              alt="Model wearing a charcoal double-breasted suit in a limestone interior"
              className="object-cover"
            />
          </div>
        </PageContainer>
      </section>

      <section className="py-20 sm:py-28">
        <PageContainer>
          <SectionHeading
            title="A considered wardrobe."
            description="Each piece is designed to earn its place: versatile foundations with a precise point of view."
            action={{ label: "View all suits", href: "/shop" }}
          />
          <ProductGrid products={products.slice(0, 3)} className="mt-11" />
        </PageContainer>
      </section>

      <section className="border-border bg-ink text-ivory border-y py-20 sm:py-28">
        <PageContainer className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="mt-5 max-w-md font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              Tailoring, made personal.
            </h2>
          </div>
          <div className="grid gap-9 sm:grid-cols-3">
            {process.map((step) => (
              <article
                key={step.number}
                className="border-ivory/25 border-t pt-5"
              >
                <p className="text-accent text-sm font-bold tracking-[0.12em]">
                  {step.number}
                </p>
                <h3 className="mt-5 font-serif text-3xl">{step.title}</h3>
                <p className="text-ivory/70 mt-4 text-sm leading-6">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="bg-stone py-20 sm:py-28">
        <PageContainer className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="bg-clay relative aspect-[4/5] overflow-hidden">
            <Image
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              src="/images/suit-grey.png"
              alt="Model wearing a tailored mid-gray wool suit"
              className="object-cover"
            />
          </div>
          <div className="max-w-lg">
            <h2 className="mt-5 font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              Ease, without compromise.
            </h2>
            <p className="text-muted-foreground mt-6 text-base leading-7">
              The best suit should never feel like a costume. Our house cut is
              quietly structured, softly shouldered, and balanced to move with
              you from first meeting to final train.
            </p>
            <Link className="text-link mt-8" href="/about">
              Discover our philosophy
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
