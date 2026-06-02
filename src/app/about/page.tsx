import Image from "next/image";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

const values = [
  {
    id: "01",
    title: "Proportion over trend",
    description:
      "A balanced silhouette has staying power. We refine the line, not the noise.",
  },
  {
    id: "02",
    title: "Cloth with purpose",
    description:
      "Every fabric is selected for how it feels, falls, breathes, and ages.",
  },
  {
    id: "03",
    title: "Service, remembered",
    description:
      "Your preferences and measurements become the start of every future garment.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-stone py-16 sm:py-24">
        <PageContainer className="grid items-end gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="max-w-xl pb-3">
            <h1 className="text-ink font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
              A quieter expression of tailoring.
            </h1>
            <p className="text-muted-foreground mt-7 max-w-lg text-base leading-7">
              Arden was founded on a simple belief: a suit should feel personal
              long before it feels formal. Every garment begins with your life,
              your preferences, and your proportions.
            </p>
          </div>
          <div className="bg-clay relative aspect-[4/5] overflow-hidden">
            <Image
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              src="/images/suit-olive.png"
              alt="Model wearing a dark olive suit against a warm plaster backdrop"
              className="object-cover"
            />
          </div>
        </PageContainer>
      </section>
      <section className="py-20 sm:py-28">
        <PageContainer className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <h2 className="text-ink font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              Built around what matters.
            </h2>
          </div>
          <div className="divide-border border-border divide-y border-t">
            {values.map(({ id, title, description }) => (
              <article
                className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr]"
                key={id}
              >
                <p className="text-accent-strong text-sm font-bold tracking-[0.12em]">
                  {id}
                </p>
                <div>
                  <h3 className="text-ink font-serif text-3xl">{title}</h3>
                  <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>
      <section className="bg-ink text-ivory py-16 sm:py-20">
        <PageContainer className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <h2 className="max-w-2xl font-serif text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
            Begin with a conversation at our studio.
          </h2>
          <Link className="button-accent shrink-0" href="/contact">
            Book a fitting
          </Link>
        </PageContainer>
      </section>
    </>
  );
}
