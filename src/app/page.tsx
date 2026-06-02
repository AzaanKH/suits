import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Scissors, Sparkles, Waves } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { SectionHeading } from "@/components/storefront/section-heading";

const process = [
  {
    number: "01",
    title: "Select your suit",
    description:
      "Start with a house silhouette and cloth suited to your wardrobe, season, and occasion.",
  },
  {
    number: "02",
    title: "Make it yours",
    description:
      "Select the lapel, lining, buttons, and finishing touches that make the garment yours.",
  },
  {
    number: "03",
    title: "Share your measurements",
    description:
      "Meet with a stylist so your measurements and preferences become a balanced personal pattern.",
  },
  {
    number: "04",
    title: "Receive your tailoring",
    description:
      "Your garment is cut, finished, quality checked, and delivered in approximately four to six weeks.",
  },
];

const materials = [
  {
    icon: Waves,
    title: "Natural performance",
    description:
      "Breathable, resilient wools selected for drape, recovery, and long days of wear.",
  },
  {
    icon: Scissors,
    title: "Quiet construction",
    description:
      "Half canvas foundations, restrained structure, and careful finishing where it matters.",
  },
  {
    icon: Sparkles,
    title: "A lasting wardrobe",
    description:
      "Cloths with depth and silhouettes designed to remain relevant season after season.",
  },
];

const testimonials = [
  {
    quote:
      "The first suit I reach for on a demanding day. It feels polished without ever feeling stiff.",
    name: "Marcus T.",
    context: "New York",
  },
  {
    quote:
      "The process was considered from start to finish. Every choice felt clear, and the fit is exceptional.",
    name: "Daniel R.",
    context: "Chicago",
  },
  {
    quote:
      "A genuinely useful wardrobe piece. I have worn the jacket separately almost as much as the full suit.",
    name: "Elliot W.",
    context: "Los Angeles",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-border bg-stone border-b">
        <PageContainer className="grid min-h-[calc(100svh-5rem)] items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-16">
          <div className="max-w-2xl py-8 lg:py-16">
            <h1 className="text-ink font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-7xl lg:text-[6.75rem]">
              A custom suit, without the old rules.
            </h1>
            <p className="text-muted-foreground mt-7 max-w-lg text-base leading-7 sm:text-lg sm:leading-8">
              Personal tailoring for a life in motion. Start with a refined
              house silhouette, customize every considered detail, and receive a
              suit cut specifically for your proportions.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="button-primary" href="/shop">
                Shop custom suits
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
            title="The essential collection."
            description="A focused edit of versatile foundations, seasonal cloths, and occasion tailoring. Every style is made to your measurements."
            action={{ label: "View all suits", href: "/shop" }}
          />
          <FeaturedProducts />
        </PageContainer>
      </section>

      <section className="border-border bg-ink text-ivory border-y py-20 sm:py-28">
        <PageContainer>
          <div>
            <h2 className="max-w-md font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              Tailoring, made personal.
            </h2>
          </div>
          <div className="mt-12 grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
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
            <h2 className="font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              Ease, built into every line.
            </h2>
            <p className="text-muted-foreground mt-6 text-base leading-7">
              We start with expressive natural cloths from respected mills and
              finish with a softly structured construction that moves easily.
              The result feels composed, never rigid.
            </p>
            <div className="mt-9 space-y-6">
              {materials.map(({ icon: Icon, title, description }) => (
                <div className="flex gap-4" key={title}>
                  <Icon
                    aria-hidden="true"
                    className="text-accent-strong mt-1 size-5 shrink-0"
                  />
                  <div>
                    <h3 className="text-ink text-sm font-bold tracking-[0.08em] uppercase">
                      {title}
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="py-20 sm:py-28">
        <PageContainer>
          <SectionHeading
            title="What clients say."
            description="Early notes from clients building a more useful tailoring wardrobe."
          />
          <div className="mt-11 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                className="border-border border p-6 sm:p-7"
                key={testimonial.name}
              >
                <blockquote className="text-ink font-serif text-3xl leading-[1.08] tracking-[-0.02em]">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="text-muted-foreground mt-7 text-xs font-bold tracking-[0.1em] uppercase">
                  {testimonial.name} / {testimonial.context}
                </figcaption>
              </figure>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="bg-accent border-border border-t py-16 sm:py-20">
        <PageContainer className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-ink max-w-3xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              Begin with one suit that is unmistakably yours.
            </h2>
          </div>
          <Link className="button-primary shrink-0" href="/shop">
            Explore the collection
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </PageContainer>
      </section>
    </>
  );
}
