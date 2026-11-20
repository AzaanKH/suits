import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { SectionHeading } from "@/components/storefront/section-heading";
import { SUIT_3D_PRODUCT_SLUG } from "@/features/customizer/three-d/suit-selection";
import { cn } from "@/lib/utils";

const STUDIO_HREF = `/studio/${SUIT_3D_PRODUCT_SLUG}`;

// Chalk notes on the hero render. Points are fractions of the image; labels sit
// in the margin on the side named.
const heroNotes = [
  { term: "Lapel", value: "Notch", x: 0.54, y: 0.11, side: "right" },
  { term: "Breast pocket", value: "Welt", x: 0.56, y: 0.18, side: "right" },
  {
    term: "Hip pockets",
    value: "Straight flap",
    x: 0.57,
    y: 0.36,
    side: "right",
  },
  {
    term: "Cloth",
    value: "Navy hopsack, 280 g",
    x: 0.34,
    y: 0.2,
    side: "left",
  },
  { term: "Buttons", value: "Horn, two", x: 0.49, y: 0.29, side: "left" },
  {
    term: "Trousers",
    value: "Flat front, side adjusters",
    x: 0.42,
    y: 0.55,
    side: "left",
  },
] as const;

// What the studio lets you change, as the cutter's specification sheet.
const specification = [
  {
    term: "Cloth",
    values:
      "Navy hopsack · grey traveller · olive flannel · charcoal pick-and-pick · midnight barathea · stone wool-linen",
  },
  {
    term: "Jacket",
    values: "Single-breasted, two button · one button · double-breasted 6×2",
  },
  { term: "Lapel", values: "Notch · peak · shawl" },
  { term: "Buttons", values: "Horn · smoked pearl · self-covered" },
  { term: "Pockets", values: "Straight flap · slanted flap · patch · jetted" },
  {
    term: "Trousers",
    values: "Side adjusters · belt loops · brace buttons · flat or pleated",
  },
  {
    term: "Finishing",
    values:
      "Matching waistcoat · working cuffs · monogram · full-canvas construction",
  },
];

const process = [
  {
    title: "Design it in the studio",
    description:
      "Turn the suit, click a part, change it. Cloth, cut, lapel, buttons, pockets and trousers update as you go, with the price beside them.",
  },
  {
    title: "Give us your fit",
    description:
      "Order in a standard size, or save a measurement profile. Measurements are reviewed by a tailor before anything is cut.",
  },
  {
    title: "Drafted and cut",
    description:
      "Your pattern is drafted from those measurements, and your cloth is cut to it with the details from your specification.",
  },
  {
    title: "Finished and delivered",
    description:
      "Made up, pressed and checked, then sent to you in about four to six weeks.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="paper-grid border-border border-b">
        <PageContainer className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6 lg:py-16">
          <div className="max-w-xl">
            <h1 className="text-ink font-serif text-6xl leading-[0.92] tracking-[-0.02em] sm:text-7xl lg:text-[6.5rem]">
              Cut for <em>one.</em>
            </h1>
            <p className="text-muted-foreground mt-7 max-w-md text-base leading-7 sm:text-lg sm:leading-8">
              Design your suit in the Arden studio, part by part. We draft a
              pattern from your measurements and cut it from the cloth you
              chose.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="button-primary" href={STUDIO_HREF}>
                Open the studio
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link className="button-secondary" href="/shop">
                See the house suits
              </Link>
            </div>
            <p className="spec text-chalk mt-9 flex flex-wrap gap-x-5 gap-y-1">
              <span>From $1,195</span>
              <span>Standard or made to measure</span>
              <span>4–6 weeks</span>
            </p>
          </div>

          <figure className="relative">
            <Link
              href={STUDIO_HREF}
              className="group bg-background border-border relative mx-auto block aspect-[1200/1520] w-full max-w-[34rem] border"
              aria-label="Open the studio with this suit"
            >
              <Image
                priority
                fill
                sizes="(min-width: 1024px) 34rem, 100vw"
                src="/images/studio-suit.webp"
                alt="The House Suit in navy hopsack, rendered in the Arden studio"
                className="object-contain"
              />
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden size-full overflow-visible lg:block"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {heroNotes.map((note) => (
                  // Left-hand notes need the margin beside the headline; it only exists from xl up.
                  <g
                    key={note.term}
                    className={
                      note.side === "left" ? "hidden xl:inline" : undefined
                    }
                  >
                    <line
                      x1={note.x * 100}
                      y1={note.y * 100}
                      x2={note.side === "right" ? 76 : -4}
                      y2={note.y * 100}
                      stroke="var(--chalk)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={note.x * 100}
                      cy={note.y * 100}
                      r="0.7"
                      fill="var(--chalk)"
                    />
                  </g>
                ))}
              </svg>
              {heroNotes.map((note) => (
                <span
                  key={note.term}
                  aria-hidden="true"
                  className={cn(
                    "spec absolute hidden -translate-y-1/2 flex-col leading-4",
                    note.side === "left" ? "xl:flex" : "lg:flex",
                  )}
                  style={{
                    top: `${note.y * 100}%`,
                    ...(note.side === "right"
                      ? { left: "calc(76% + 6px)" }
                      : {
                          right: "calc(104% + 6px)",
                          alignItems: "flex-end",
                          textAlign: "right",
                        }),
                  }}
                >
                  <span className="text-chalk whitespace-nowrap">
                    {note.term}
                  </span>
                  <span className="text-ink whitespace-nowrap">
                    {note.value}
                  </span>
                </span>
              ))}
              <span className="spec bg-ink text-ivory group-hover:bg-accent absolute right-3 bottom-3 px-3 py-2 transition-colors">
                Drag to turn it in the studio →
              </span>
            </Link>
            <figcaption className="sr-only">
              Default specification: notch lapel, welt breast pocket, straight
              flap pockets, navy hopsack cloth, two horn buttons, flat-front
              trousers with side adjusters.
            </figcaption>
          </figure>
        </PageContainer>
      </section>

      <section className="py-20 sm:py-28">
        <PageContainer className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="max-w-md">
            <h2 className="text-ink font-serif text-4xl leading-[1.02] tracking-[-0.015em] sm:text-5xl">
              Every part is yours to change.
            </h2>
            <p className="text-muted-foreground mt-5 text-base leading-7">
              This is the specification sheet the cutter works from. In the
              studio you fill it in by clicking the suit itself.
            </p>
            <Link className="text-link mt-8" href={STUDIO_HREF}>
              Start in the studio
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <dl className="border-ink border-t">
            {specification.map((row) => (
              <div
                key={row.term}
                className="border-border grid gap-1 border-b py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6"
              >
                <dt className="spec text-chalk pt-0.5">{row.term}</dt>
                <dd className="text-ink text-sm leading-6">{row.values}</dd>
              </div>
            ))}
          </dl>
        </PageContainer>
      </section>

      <section
        id="tailoring-process"
        className="bg-ink text-ivory scroll-mt-24 py-20 sm:py-28"
      >
        <PageContainer className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
          <div>
            <h2 className="max-w-lg font-serif text-4xl leading-[1.02] tracking-[-0.015em] sm:text-5xl">
              From the studio to the cutting table.
            </h2>
            <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {process.map((step, index) => (
                <li key={step.title} className="border-ivory/20 border-t pt-5">
                  <p className="spec text-chalk-light">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-serif text-2xl">{step.title}</h3>
                  <p className="text-ivory/70 mt-3 text-sm leading-6">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <figure className="border-ivory/15 self-start border p-6 sm:p-8">
            <PatternPiece />
            <figcaption className="spec text-ivory/55 mt-4">
              Illustration: a jacket forepart as drafted, with grain line and
              seam allowance.
            </figcaption>
          </figure>
        </PageContainer>
      </section>

      <section className="py-20 sm:py-28">
        <PageContainer>
          <SectionHeading
            title="Or start from a house suit."
            description="Three starting points, each fully adjustable once you open it."
            action={{ label: "All suits", href: "/shop" }}
          />
          <FeaturedProducts />
        </PageContainer>
      </section>

      <section className="paper-grid border-border border-t py-16 sm:py-20">
        <PageContainer className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="text-ink max-w-2xl font-serif text-4xl leading-[1.02] tracking-[-0.015em] sm:text-5xl">
            Your suit is one click from the cutting table.
          </h2>
          <Link className="button-primary shrink-0" href={STUDIO_HREF}>
            Open the studio
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </PageContainer>
      </section>
    </>
  );
}

/** A drafted jacket forepart: outline, dashed seam allowance, grain line, notes. */
function PatternPiece() {
  return (
    <svg
      viewBox="0 0 320 300"
      className="h-auto w-full"
      role="img"
      aria-label="Drafted jacket forepart with grain line and measurements"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M70 30 L150 22 L205 40 L240 92 L232 150 L246 260 L84 266 L64 150 L52 92 Z" />
        <path
          d="M78 39 L148 31 L198 48 L230 94 L222 150 L235 251 L92 257 L73 150 L61 94 Z"
          strokeDasharray="4 4"
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M150 22 L138 120 L150 266"
          strokeDasharray="2 5"
          opacity="0.6"
        />
      </g>
      <g
        stroke="var(--chalk-light)"
        strokeWidth="1.2"
        fill="var(--chalk-light)"
      >
        <line x1="112" y1="80" x2="112" y2="210" />
        <path d="M108 88 L112 78 L116 88 Z" />
        <path d="M108 202 L112 212 L116 202 Z" />
        <path
          d="M64 150 l-7 -4 M64 150 l-7 4 M232 150 l7 -4 M232 150 l7 4"
          fill="none"
        />
      </g>
      <g
        fill="var(--chalk-light)"
        fontFamily="var(--font-data), monospace"
        fontSize="9"
      >
        <text x="118" y="150">
          GRAIN
        </text>
        <text x="244" y="146">
          ½ CHEST 51.0
        </text>
        <text x="212" y="32">
          SHOULDER 15.4
        </text>
        <text x="150" y="284" textAnchor="middle">
          BACK LENGTH 76.5 cm
        </text>
      </g>
    </svg>
  );
}
