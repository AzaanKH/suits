import { ContactForm } from "@/components/contact/contact-form";
import { PageContainer } from "@/components/layout/page-container";

export default function ContactPage() {
  return (
    <PageContainer className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:py-24">
      <div className="max-w-lg">
        <h1 className="text-ink font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-7xl">
          Let&apos;s begin.
        </h1>
        <p className="text-muted-foreground mt-6 text-base leading-7">
          Whether you are building a wardrobe, preparing for an occasion, or
          simply curious about the process, our studio team is here to help.
        </p>
        <div className="border-border text-muted-foreground mt-9 border-t pt-6 text-sm leading-7">
          <p className="text-ink font-semibold">New York studio</p>
          <p>22 Mercer Street, New York, NY</p>
          <p>Tuesday to Saturday, 10am to 6pm</p>
          <a
            className="text-ink mt-4 inline-block underline underline-offset-4"
            href="tel:+12125550148"
          >
            +1 212 555 0148
          </a>
        </div>
      </div>
      <ContactForm />
    </PageContainer>
  );
}
