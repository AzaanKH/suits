import { PageContainer } from "@/components/layout/page-container";
import { SavedDesignDetail } from "@/features/saved-designs/components/saved-design-detail";
import { isClerkConfigured } from "@/lib/clerk-config";

type SavedDesignDetailPageProps = {
  params: Promise<{
    designId: string;
  }>;
};

export default async function SavedDesignDetailPage({
  params,
}: SavedDesignDetailPageProps) {
  const clerkConfigured = isClerkConfigured();

  const { designId } = await params;

  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <SavedDesignDetail
        clerkConfigured={clerkConfigured}
        designId={designId}
      />
    </PageContainer>
  );
}
