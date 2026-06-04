import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { MeasurementProfilesManager } from "@/features/measurements/components/measurement-profiles-manager";
import { isClerkConfigured } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: "Measurement Profiles",
};

export default async function MeasurementProfilesPage() {
  const clerkConfigured = isClerkConfigured();

  if (clerkConfigured) {
    await auth.protect();
  }

  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Measurement profiles
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
            Save the body measurements and fit preferences needed before a suit
            can move into production.
          </p>
        </div>
      </div>
      <MeasurementProfilesManager clerkConfigured={clerkConfigured} />
    </PageContainer>
  );
}
