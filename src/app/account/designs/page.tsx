import { PageContainer } from "@/components/layout/page-container";
import { isClerkConfigured } from "@/lib/clerk-config";
import { SavedDesignsList } from "@/features/saved-designs/components/saved-designs-list";

export default async function SavedDesignsPage() {
  const clerkConfigured = isClerkConfigured();

  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Saved designs
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
            Review, duplicate, and resume your suit configurations.
          </p>
        </div>
      </div>
      <SavedDesignsList clerkConfigured={clerkConfigured} />
    </PageContainer>
  );
}
