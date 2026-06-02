import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

export default function AccountPage() {
  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <section className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Client account</p>
        <h1 className="text-ink mt-5 font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
          Welcome to Arden.
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-lg text-sm leading-6">
          Your account will hold your measurements, garment history, and
          appointments. Authentication is introduced in the next service
          integration pass.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="button-primary" href="/contact">
            Book a fitting
          </Link>
          <Link className="button-secondary" href="/shop">
            Browse suits
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
