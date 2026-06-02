import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

const footerLinks = [
  {
    title: "Explore",
    links: [
      { label: "Shop suits", href: "/shop" },
      { label: "Our approach", href: "/about" },
      { label: "Book a fitting", href: "/contact" },
    ],
  },
  {
    title: "Client care",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Shipping & returns", href: "/contact" },
      { label: "Privacy", href: "/contact" },
      { label: "Terms", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-ivory/10 bg-ink text-ivory border-t py-14 sm:py-16">
      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Link
              className="font-serif text-[2.5rem] leading-none tracking-[-0.08em]"
              href="/"
            >
              ARDEN
            </Link>
            <p className="text-ivory/65 mt-5 max-w-sm text-sm leading-6">
              Personal tailoring for a modern wardrobe. Designed with purpose,
              made to last.
            </p>
            <address className="text-ivory/65 mt-7 text-sm leading-6 not-italic">
              22 Mercer Street, New York
              <br />
              <a href="mailto:studio@arden-tailoring.com">
                studio@arden-tailoring.com
              </a>
            </address>
          </div>
          <div className="grid gap-10 sm:grid-cols-[0.7fr_0.8fr_1.4fr]">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h2 className="text-accent text-sm font-bold tracking-[0.1em] uppercase">
                  {group.title}
                </h2>
                <ul className="text-ivory/70 mt-5 space-y-3 text-sm">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        className="hover:text-ivory transition-colors"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h2 className="text-accent text-sm font-bold tracking-[0.1em] uppercase">
                The journal
              </h2>
              <p className="text-ivory/65 mt-5 text-sm leading-6">
                Occasional notes on cloth, cut, and building a lasting wardrobe.
              </p>
              <form className="border-ivory/40 mt-5 flex border-b" action="#">
                <label className="sr-only" htmlFor="newsletter-email">
                  Email address
                </label>
                <input
                  className="text-ivory placeholder:text-ivory/45 min-w-0 flex-1 bg-transparent py-3 text-sm focus:outline-none"
                  id="newsletter-email"
                  type="email"
                  placeholder="Email address"
                />
                <button
                  className="text-ivory text-sm font-bold tracking-[0.08em] uppercase"
                  type="submit"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
        <p className="border-ivory/10 text-ivory/55 mt-14 border-t pt-6 text-sm">
          © 2026 Arden Tailoring. All rights reserved.
        </p>
      </PageContainer>
    </footer>
  );
}
