import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <PageContainer className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-14">
      {clerkConfigured ? (
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/account"
          signInFallbackRedirectUrl="/account"
        />
      ) : (
        <AuthSetupMessage />
      )}
    </PageContainer>
  );
}

function AuthSetupMessage() {
  return (
    <section className="max-w-xl text-center">
      <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em]">
        Sign-up setup required.
      </h1>
      <p className="text-muted-foreground mx-auto mt-6 max-w-md text-sm leading-6">
        Add Clerk environment variables to enable account creation.
      </p>
      <Link className="button-secondary mt-8" href="/shop">
        Continue browsing
      </Link>
    </section>
  );
}
