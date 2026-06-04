import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default async function AccountPage() {
  if (!clerkConfigured) {
    return (
      <PageContainer className="py-16 sm:py-20 lg:py-24">
        <section className="mx-auto max-w-xl text-center">
          <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Account setup required.
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-lg text-sm leading-6">
            Add Clerk keys to <code>.env.local</code> to enable protected account
            access.
          </p>
        </section>
      </PageContainer>
    );
  }

  const { userId } = await auth.protect();
  const user = await currentUser();
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "No email on file";
  const displayName =
    user?.fullName ?? user?.username ?? primaryEmail ?? "Arden customer";

  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
            Account
          </p>
          <h1 className="text-ink mt-3 font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Welcome, {displayName}.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-lg text-sm leading-6">
            Your saved designs and checkout details stay tied to your Clerk
            account. Arden stores the Clerk user id for ownership checks, not a
            duplicate profile record.
          </p>
        </section>

        <section className="border-border bg-card rounded-lg border p-6 sm:p-7">
          <h2 className="text-ink font-serif text-4xl leading-none">
            Identity details
          </h2>
          <dl className="divide-border mt-7 divide-y text-sm">
            <AccountDetail label="Clerk user ID" value={userId} />
            <AccountDetail label="Email" value={primaryEmail} />
            <AccountDetail label="Signed in as" value={displayName} />
          </dl>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="button-primary" href="/shop">
              Browse suits
            </Link>
            <Link className="button-secondary" href="/contact">
              Book a fitting
            </Link>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]">
      <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
        {label}
      </dt>
      <dd className="text-ink break-words font-medium">{value}</dd>
    </div>
  );
}
